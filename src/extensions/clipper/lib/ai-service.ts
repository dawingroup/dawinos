/**
 * AI Analysis Service - Uses Gemini for image analysis
 */

import type { ClipRecord, AIAnalysis } from '../types/database';
import { getClipById, updateClip } from './database';

class AIService {
  private apiEndpoint: string | null = null;

  /**
   * Set the API endpoint for AI analysis
   */
  setEndpoint(endpoint: string): void {
    this.apiEndpoint = endpoint;
  }

  /**
   * Analyze a clip's image using AI
   */
  async analyzeClip(clipId: string): Promise<AIAnalysis | null> {
    const clip = await getClipById(clipId);
    if (!clip) {
      throw new Error('Clip not found');
    }

    // Get image data
    let imageData: string;
    if (clip.imageBlob) {
      imageData = await this.blobToBase64(clip.imageBlob);
    } else if (clip.imageUrl) {
      // Fetch through service worker for CORS
      const response = await chrome.runtime.sendMessage({
        type: 'FETCH_IMAGE',
        url: clip.imageUrl,
      });
      if (!response.success) {
        throw new Error('Failed to fetch image for analysis');
      }
      imageData = response.dataUrl;
    } else {
      throw new Error('No image data available');
    }

    // Call AI analysis endpoint
    const result = await this.callAnalysisAPI(imageData, clip);

    // Update clip with analysis results
    await updateClip(clipId, {
      aiAnalysis: result,
      // Auto-populate empty fields from AI analysis
      materials: clip.materials?.length ? clip.materials : result.primaryMaterials,
      colors: clip.colors?.length ? clip.colors : result.colors,
      tags: [...new Set([...(clip.tags || []), ...result.suggestedTags])],
    });

    return result;
  }

  /**
   * Call the AI analysis API
   */
  private async callAnalysisAPI(
    imageData: string,
    clip: ClipRecord
  ): Promise<AIAnalysis> {
    // If no endpoint configured, use local heuristics
    if (!this.apiEndpoint) {
      return this.localAnalysis(clip);
    }

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          context: {
            title: clip.title,
            sourceUrl: clip.sourceUrl,
            existingMaterials: clip.materials,
            existingColors: clip.colors,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        ...data,
        analyzedAt: new Date(),
      };
    } catch (error) {
      console.error('AI analysis failed, using local fallback:', error);
      return this.localAnalysis(clip);
    }
  }

  /**
   * Local analysis fallback when AI API is not available
   */
  private localAnalysis(clip: ClipRecord): AIAnalysis {
    const title = clip.title?.toLowerCase() || '';
    const description = clip.description?.toLowerCase() || '';
    const combined = `${title} ${description}`;

    // Style detection
    const styles = {
      modern: ['modern', 'contemporary', 'minimalist', 'sleek', 'clean lines'],
      traditional: ['traditional', 'classic', 'antique', 'vintage', 'ornate'],
      rustic: ['rustic', 'farmhouse', 'barn', 'reclaimed', 'distressed'],
      industrial: ['industrial', 'metal', 'iron', 'steel', 'factory'],
      midcentury: ['mid-century', 'midcentury', 'retro', '1950s', '1960s'],
      scandinavian: ['scandinavian', 'nordic', 'hygge', 'danish'],
      bohemian: ['bohemian', 'boho', 'eclectic', 'global'],
      coastal: ['coastal', 'beach', 'nautical', 'seaside'],
    };

    let detectedStyle = 'Contemporary';
    for (const [style, keywords] of Object.entries(styles)) {
      if (keywords.some(kw => combined.includes(kw))) {
        detectedStyle = style.charAt(0).toUpperCase() + style.slice(1);
        break;
      }
    }

    // Detect product type
    let productType = 'Furniture';
    if (combined.includes('cabinet') || combined.includes('shelf') || combined.includes('bookcase')) {
      productType = 'Storage';
    } else if (combined.includes('sofa') || combined.includes('chair') || combined.includes('bench')) {
      productType = 'Seating';
    } else if (combined.includes('table') || combined.includes('desk')) {
      productType = 'Table';
    } else if (combined.includes('bed') || combined.includes('mattress')) {
      productType = 'Bedroom';
    }

    // Generate tags
    const suggestedTags: string[] = [];
    if (detectedStyle !== 'Contemporary') {
      suggestedTags.push(detectedStyle.toLowerCase());
    }
    if (clip.brand) {
      suggestedTags.push(clip.brand.toLowerCase());
    }
    suggestedTags.push(productType.toLowerCase());

    // Determine millwork assessment
    const isCustomCandidate = combined.includes('custom') || 
      combined.includes('built-in') || 
      combined.includes('millwork') ||
      productType === 'Storage';

    return {
      analyzedAt: new Date(),
      confidence: 0.6, // Lower confidence for local analysis
      productType,
      style: detectedStyle,
      primaryMaterials: clip.materials || [],
      colors: clip.colors || [],
      suggestedTags,
      millworkAssessment: {
        isCustomCandidate,
        complexity: 'moderate',
        keyFeatures: [],
        considerations: isCustomCandidate 
          ? ['Consider custom dimensions', 'Material selection important']
          : [],
      },
    };
  }

  /**
   * Convert blob to base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Batch analyze multiple clips
   */
  async analyzeMultiple(clipIds: string[]): Promise<Map<string, AIAnalysis | null>> {
    const results = new Map<string, AIAnalysis | null>();
    
    for (const clipId of clipIds) {
      try {
        const result = await this.analyzeClip(clipId);
        results.set(clipId, result);
      } catch (error) {
        console.error(`Failed to analyze clip ${clipId}:`, error);
        results.set(clipId, null);
      }
    }

    return results;
  }
}

export const aiService = new AIService();
