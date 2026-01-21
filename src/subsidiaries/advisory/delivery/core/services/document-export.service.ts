/**
 * Document Export Service
 *
 * Exports documents from Firebase Storage to external storage providers:
 * - Microsoft SharePoint (via Microsoft Graph API)
 * - Google Drive (via Google Drive API)
 *
 * Features:
 * - Mirrored folder structure
 * - Scheduled batch export (Cloud Scheduler)
 * - Document URL tracking in Firestore
 * - Sync status monitoring
 * - Retry failed exports
 */

import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
  writeBatch,
  orderBy,
  limit,
  setDoc,
} from 'firebase/firestore';
import { db } from '../../../../../config/firebase';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { DocumentMetadata } from '../../types/document';

export type ExportProvider = 'sharepoint' | 'google_drive';

export interface ExportConfiguration {
  id: string;
  provider: ExportProvider;
  enabled: boolean;

  // Provider-specific settings
  settings: SharePointSettings | GoogleDriveSettings;

  // Folder mapping
  folderMapping: {
    firebasePath: string; // e.g., "advisory/delivery/{projectCode}/{year}/requisitions"
    externalPath: string; // e.g., "Shared Documents/Advisory/Delivery/{projectCode}/{year}/Requisitions"
  }[];

  // Sync settings
  syncFrequency: 'real_time' | 'hourly' | 'daily' | 'manual';
  lastSyncAt?: Timestamp;

  // Filters
  includeFileTypes?: string[]; // e.g., ['.pdf', '.xlsx', '.jpg']
  excludeFileTypes?: string[];
  minFileSizeBytes?: number;
  maxFileSizeBytes?: number;

  // Audit
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SharePointSettings {
  tenantId: string;
  clientId: string;
  clientSecret: string; // Encrypted
  siteUrl: string; // e.g., "https://contoso.sharepoint.com/sites/DawinAdvisory"
  driveId?: string; // Auto-discovered if not provided
  rootFolderId?: string;
}

export interface GoogleDriveSettings {
  serviceAccountEmail: string;
  privateKey: string; // Encrypted
  rootFolderId: string; // Google Drive folder ID
  sharedDriveId?: string; // For shared/team drives
}

export interface ExportJob {
  id: string;
  configurationId: string;
  provider: ExportProvider;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';

  // Job details
  totalDocuments: number;
  exportedDocuments: number;
  failedDocuments: number;
  skippedDocuments: number;

  // Timing
  startedAt: Timestamp;
  completedAt?: Timestamp;
  duration?: number; // milliseconds

  // Errors
  errors?: ExportError[];

  // Results
  exportedFiles?: ExportedFileInfo[];
}

export interface ExportError {
  documentId: string;
  documentPath: string;
  error: string;
  timestamp: Timestamp;
  retryCount: number;
}

export interface ExportedFileInfo {
  documentId: string;
  firebasePath: string;
  externalUrl: string;
  externalId: string; // SharePoint item ID or Google Drive file ID
  exportedAt: Timestamp;
  fileSize: number;
}

export interface DocumentExportStatus {
  documentId: string;
  exports: {
    provider: ExportProvider;
    status: 'pending' | 'exported' | 'failed';
    externalUrl?: string;
    externalId?: string;
    lastExportedAt?: Timestamp;
    errorMessage?: string;
  }[];
}

export class DocumentExportService {
  private storage = getStorage();

  /**
   * Export all pending documents
   */
  async exportPendingDocuments(configurationId: string): Promise<ExportJob> {
    const config = await this.getConfiguration(configurationId);

    if (!config.enabled) {
      throw new Error(`Export configuration ${configurationId} is disabled`);
    }

    // Create export job
    const jobId = doc(collection(db, 'temp')).id;
    const job: ExportJob = {
      id: jobId,
      configurationId,
      provider: config.provider,
      status: 'pending',
      totalDocuments: 0,
      exportedDocuments: 0,
      failedDocuments: 0,
      skippedDocuments: 0,
      startedAt: Timestamp.now(),
      errors: [],
      exportedFiles: [],
    };

    await setDoc(doc(db, 'export_jobs', jobId), job);

    try {
      // Update job status
      await updateDoc(doc(db, 'export_jobs', jobId), { status: 'in_progress' });

      // Get documents to export
      const documents = await this.getDocumentsToExport(config);
      job.totalDocuments = documents.length;

      console.log(`[DocumentExport] Starting export job ${jobId}: ${documents.length} documents`);

      // Export documents in batches
      const batchSize = 10;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (docData) => {
            try {
              const result = await this.exportDocument(docData, config);

              if (result.success) {
                job.exportedDocuments++;
                job.exportedFiles!.push({
                  documentId: docData.id,
                  firebasePath: docData.storagePath,
                  externalUrl: result.externalUrl!,
                  externalId: result.externalId!,
                  exportedAt: Timestamp.now(),
                  fileSize: docData.sizeBytes,
                });

                // Update document metadata
                await this.updateDocumentExportStatus(docData.id, config.provider, {
                  status: 'exported',
                  externalUrl: result.externalUrl,
                  externalId: result.externalId,
                  lastExportedAt: Timestamp.now(),
                });
              } else {
                job.failedDocuments++;
                job.errors!.push({
                  documentId: docData.id,
                  documentPath: docData.storagePath,
                  error: result.error || 'Unknown error',
                  timestamp: Timestamp.now(),
                  retryCount: 0,
                });
              }
            } catch (error) {
              job.failedDocuments++;
              job.errors!.push({
                documentId: docData.id,
                documentPath: docData.storagePath,
                error: error instanceof Error ? error.message : String(error),
                timestamp: Timestamp.now(),
                retryCount: 0,
              });
            }
          })
        );

        // Update job progress
        await updateDoc(doc(db, 'export_jobs', jobId), {
          exportedDocuments: job.exportedDocuments,
          failedDocuments: job.failedDocuments,
          exportedFiles: job.exportedFiles,
          errors: job.errors,
        });
      }

      // Complete job
      job.status = 'completed';
      job.completedAt = Timestamp.now();
      job.duration = job.completedAt.toMillis() - job.startedAt.toMillis();

      await updateDoc(doc(db, 'export_jobs', jobId), {
        status: job.status,
        completedAt: job.completedAt,
        duration: job.duration,
      });

      // Update configuration last sync time
      await updateDoc(doc(db, 'export_configurations', configurationId), {
        lastSyncAt: Timestamp.now(),
      });

      console.log(`[DocumentExport] Job ${jobId} completed:`, {
        total: job.totalDocuments,
        exported: job.exportedDocuments,
        failed: job.failedDocuments,
        skipped: job.skippedDocuments,
      });

      return job;
    } catch (error) {
      // Mark job as failed
      await updateDoc(doc(db, 'export_jobs', jobId), {
        status: 'failed',
        completedAt: Timestamp.now(),
        errors: [{
          documentId: 'N/A',
          documentPath: 'N/A',
          error: error instanceof Error ? error.message : String(error),
          timestamp: Timestamp.now(),
          retryCount: 0,
        }],
      });

      throw error;
    }
  }

  /**
   * Export single document
   */
  private async exportDocument(
    docData: DocumentMetadata,
    config: ExportConfiguration
  ): Promise<{ success: boolean; externalUrl?: string; externalId?: string; error?: string }> {
    try {
      // Download document from Firebase Storage
      const downloadUrl = await getDownloadURL(ref(this.storage, docData.storagePath));
      const response = await fetch(downloadUrl);
      const blob = await response.blob();

      // Determine external folder path
      const externalPath = this.mapToExternalPath(docData.storagePath, config.folderMapping);

      // Export to provider
      if (config.provider === 'sharepoint') {
        return await this.exportToSharePoint(docData, blob, externalPath, config.settings as SharePointSettings);
      } else if (config.provider === 'google_drive') {
        return await this.exportToGoogleDrive(docData, blob, externalPath, config.settings as GoogleDriveSettings);
      }

      return { success: false, error: 'Unknown provider' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Export to SharePoint
   */
  private async exportToSharePoint(
    docData: DocumentMetadata,
    blob: Blob,
    externalPath: string,
    settings: SharePointSettings
  ): Promise<{ success: boolean; externalUrl?: string; externalId?: string; error?: string }> {
    try {
      // Get access token
      const accessToken = await this.getSharePointAccessToken(settings);

      // Ensure folder structure exists
      const folderUrl = await this.ensureSharePointFolder(externalPath, settings, accessToken);

      // Upload file
      const uploadUrl = `${settings.siteUrl}/_api/web/GetFolderByServerRelativeUrl('${folderUrl}')/Files/add(url='${docData.filename}',overwrite=true)`;

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json;odata=verbose',
          'Content-Type': 'application/octet-stream',
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`SharePoint upload failed: ${uploadResponse.status} - ${errorText}`);
      }

      const result = await uploadResponse.json();
      const fileServerRelativeUrl = result.d.ServerRelativeUrl;
      const fileUrl = `${settings.siteUrl}${fileServerRelativeUrl}`;

      return {
        success: true,
        externalUrl: fileUrl,
        externalId: result.d.UniqueId, // SharePoint GUID
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Export to Google Drive
   */
  private async exportToGoogleDrive(
    docData: DocumentMetadata,
    blob: Blob,
    externalPath: string,
    settings: GoogleDriveSettings
  ): Promise<{ success: boolean; externalUrl?: string; externalId?: string; error?: string }> {
    try {
      // Get access token using service account
      const accessToken = await this.getGoogleDriveAccessToken(settings);

      // Ensure folder structure exists
      const folderId = await this.ensureGoogleDriveFolder(externalPath, settings, accessToken);

      // Upload file using multipart upload
      const metadata = {
        name: docData.filename,
        parents: [folderId],
        mimeType: docData.mimeType,
      };

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${docData.mimeType}\r\n\r\n` +
        await blob.text() +
        closeDelimiter;

      const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Google Drive upload failed: ${uploadResponse.status} - ${errorText}`);
      }

      const result = await uploadResponse.json();
      const fileUrl = `https://drive.google.com/file/d/${result.id}/view`;

      return {
        success: true,
        externalUrl: fileUrl,
        externalId: result.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get SharePoint access token
   */
  private async getSharePointAccessToken(settings: SharePointSettings): Promise<string> {
    const tokenUrl = `https://login.microsoftonline.com/${settings.tenantId}/oauth2/v2.0/token`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: settings.clientId,
        client_secret: settings.clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get SharePoint access token: ${error}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Get Google Drive access token using service account
   */
  private async getGoogleDriveAccessToken(settings: GoogleDriveSettings): Promise<string> {
    // TODO: Implement JWT-based service account authentication
    // This requires signing a JWT with the private key and exchanging for access token
    // For now, return placeholder
    throw new Error('Google Drive service account authentication not yet implemented');
  }

  /**
   * Ensure SharePoint folder exists
   */
  private async ensureSharePointFolder(
    path: string,
    settings: SharePointSettings,
    accessToken: string
  ): Promise<string> {
    // TODO: Implement folder creation logic
    // Split path and create folders recursively
    // For now, return placeholder
    return `/Shared Documents/${path}`;
  }

  /**
   * Ensure Google Drive folder exists
   */
  private async ensureGoogleDriveFolder(
    path: string,
    settings: GoogleDriveSettings,
    accessToken: string
  ): Promise<string> {
    // TODO: Implement folder creation logic
    // Split path and create folders recursively
    // For now, return root folder ID
    return settings.rootFolderId;
  }

  /**
   * Map Firebase Storage path to external path
   */
  private mapToExternalPath(firebasePath: string, mappings: ExportConfiguration['folderMapping']): string {
    for (const mapping of mappings) {
      // Replace variables in pattern
      const pattern = mapping.firebasePath.replace(/\{([^}]+)\}/g, '([^/]+)');
      const regex = new RegExp(`^${pattern}$`);
      const match = firebasePath.match(regex);

      if (match) {
        // Extract variables
        let externalPath = mapping.externalPath;
        const variableRegex = /\{([^}]+)\}/g;
        let i = 1;
        externalPath = externalPath.replace(variableRegex, () => match[i++] || '');

        return externalPath;
      }
    }

    // No mapping found, use Firebase path as-is
    return firebasePath;
  }

  /**
   * Get documents to export
   */
  private async getDocumentsToExport(config: ExportConfiguration): Promise<DocumentMetadata[]> {
    // Query documents that haven't been exported or failed last export
    const q = query(
      collection(db, 'documents'),
      where('category', 'in', ['requisition', 'accountability', 'receipt', 'invoice', 'delivery_note']),
      orderBy('createdAt', 'desc'),
      limit(1000) // Process in batches
    );

    const snapshot = await getDocs(q);
    const documents: DocumentMetadata[] = [];

    for (const docSnap of snapshot.docs) {
      const docData = docSnap.data() as DocumentMetadata;

      // Apply filters
      if (config.includeFileTypes && !config.includeFileTypes.some(ext => docData.filename.endsWith(ext))) {
        continue;
      }

      if (config.excludeFileTypes && config.excludeFileTypes.some(ext => docData.filename.endsWith(ext))) {
        continue;
      }

      if (config.minFileSizeBytes && docData.sizeBytes < config.minFileSizeBytes) {
        continue;
      }

      if (config.maxFileSizeBytes && docData.sizeBytes > config.maxFileSizeBytes) {
        continue;
      }

      // Check if already exported
      const exportStatus = await this.getDocumentExportStatus(docSnap.id);
      const providerExport = exportStatus?.exports.find(e => e.provider === config.provider);

      if (!providerExport || providerExport.status === 'failed') {
        documents.push({ ...docData, id: docSnap.id });
      }
    }

    return documents;
  }

  /**
   * Get document export status
   */
  private async getDocumentExportStatus(documentId: string): Promise<DocumentExportStatus | null> {
    const docRef = doc(db, 'document_export_status', documentId);
    const docSnap = await getDocs(query(collection(db, 'document_export_status'), where('__name__', '==', documentId), limit(1)));

    if (docSnap.empty) return null;

    return docSnap.docs[0].data() as DocumentExportStatus;
  }

  /**
   * Update document export status
   */
  private async updateDocumentExportStatus(
    documentId: string,
    provider: ExportProvider,
    status: Partial<DocumentExportStatus['exports'][0]>
  ): Promise<void> {
    const docRef = doc(db, 'document_export_status', documentId);
    const existing = await this.getDocumentExportStatus(documentId);

    if (existing) {
      // Update existing provider status
      const updatedExports = existing.exports.map(e =>
        e.provider === provider ? { ...e, ...status } : e
      );

      // Add new provider if not exists
      if (!updatedExports.find(e => e.provider === provider)) {
        updatedExports.push({ provider, ...status } as any);
      }

      await updateDoc(docRef, { exports: updatedExports });
    } else {
      // Create new status
      await setDoc(docRef, {
        documentId,
        exports: [{ provider, ...status }],
      });
    }
  }

  /**
   * Get export configuration
   */
  private async getConfiguration(configurationId: string): Promise<ExportConfiguration> {
    const docSnap = await getDocs(
      query(collection(db, 'export_configurations'), where('__name__', '==', configurationId), limit(1))
    );

    if (docSnap.empty) {
      throw new Error(`Export configuration ${configurationId} not found`);
    }

    return docSnap.docs[0].data() as ExportConfiguration;
  }

  /**
   * Create export configuration
   */
  async createConfiguration(
    config: Omit<ExportConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'lastSyncAt'>,
    userId: string
  ): Promise<string> {
    const configId = doc(collection(db, 'temp')).id;

    const newConfig: ExportConfiguration = {
      ...config,
      id: configId,
      createdBy: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(doc(db, 'export_configurations', configId), newConfig);

    return configId;
  }

  /**
   * Retry failed exports
   */
  async retryFailedExports(jobId: string): Promise<ExportJob> {
    const jobSnap = await getDocs(
      query(collection(db, 'export_jobs'), where('__name__', '==', jobId), limit(1))
    );

    if (jobSnap.empty) {
      throw new Error(`Export job ${jobId} not found`);
    }

    const job = jobSnap.docs[0].data() as ExportJob;

    if (!job.errors || job.errors.length === 0) {
      throw new Error('No failed exports to retry');
    }

    // Get configuration
    const config = await this.getConfiguration(job.configurationId);

    // Retry failed documents
    const retriedDocuments: ExportedFileInfo[] = [];
    const stillFailed: ExportError[] = [];

    for (const error of job.errors) {
      // Get document metadata
      const docSnap = await getDocs(
        query(collection(db, 'documents'), where('__name__', '==', error.documentId), limit(1))
      );

      if (docSnap.empty) {
        stillFailed.push({ ...error, retryCount: error.retryCount + 1 });
        continue;
      }

      const docData = docSnap.docs[0].data() as DocumentMetadata;

      try {
        const result = await this.exportDocument(docData, config);

        if (result.success) {
          retriedDocuments.push({
            documentId: error.documentId,
            firebasePath: error.documentPath,
            externalUrl: result.externalUrl!,
            externalId: result.externalId!,
            exportedAt: Timestamp.now(),
            fileSize: docData.sizeBytes,
          });

          await this.updateDocumentExportStatus(error.documentId, config.provider, {
            status: 'exported',
            externalUrl: result.externalUrl,
            externalId: result.externalId,
            lastExportedAt: Timestamp.now(),
          });
        } else {
          stillFailed.push({
            ...error,
            error: result.error || 'Unknown error',
            retryCount: error.retryCount + 1,
            timestamp: Timestamp.now(),
          });
        }
      } catch (err) {
        stillFailed.push({
          ...error,
          error: err instanceof Error ? err.message : String(err),
          retryCount: error.retryCount + 1,
          timestamp: Timestamp.now(),
        });
      }
    }

    // Update job
    const updatedJob: ExportJob = {
      ...job,
      exportedDocuments: job.exportedDocuments + retriedDocuments.length,
      failedDocuments: stillFailed.length,
      exportedFiles: [...(job.exportedFiles || []), ...retriedDocuments],
      errors: stillFailed,
    };

    await updateDoc(doc(db, 'export_jobs', jobId), updatedJob);

    return updatedJob;
  }
}

export const documentExportService = new DocumentExportService();
