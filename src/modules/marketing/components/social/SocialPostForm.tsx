/**
 * SocialPostForm Component
 * Form for creating and editing social media posts
 */

import { useState, useEffect } from 'react';
import { X, Save, Loader2, Image, Clock } from 'lucide-react';
import type { SocialMediaPost, SocialPostFormData, SocialPlatform, MediaType } from '../../types';
import { SOCIAL_PLATFORMS, POST_CONTENT_MAX_LENGTH, POST_TITLE_MAX_LENGTH } from '../../constants';
import { useCampaigns } from '../../hooks';
import { useAuth } from '@/contexts/AuthContext';

interface SocialPostFormProps {
  post?: SocialMediaPost;
  initialDate?: Date;
  onSubmit: (data: SocialPostFormData) => Promise<void>;
  onClose: () => void;
}

const INITIAL_FORM: SocialPostFormData = {
  title: '',
  content: '',
  platforms: [],
  mediaUrls: [],
  mediaType: 'image',
  tags: [],
};

export function SocialPostForm({ post, initialDate, onSubmit, onClose }: SocialPostFormProps) {
  const { user } = useAuth();
  const { campaigns } = useCampaigns(user?.companyId, { status: 'active' });

  const [form, setForm] = useState<SocialPostFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const isEditing = !!post;

  useEffect(() => {
    if (post) {
      setForm({
        title: post.title,
        content: post.content,
        platforms: post.platforms,
        mediaUrls: post.mediaUrls || [],
        mediaType: post.mediaType || 'image',
        scheduledFor: post.scheduledFor?.toDate(),
        campaignId: post.campaignId,
        tags: post.tags || [],
        category: post.category,
      });
    } else if (initialDate) {
      setForm((prev) => ({ ...prev, scheduledFor: initialDate }));
    }
  }, [post, initialDate]);

  const togglePlatform = (platform: SocialPlatform) => {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.content.trim()) newErrors.content = 'Content is required';
    if (form.content.length > POST_CONTENT_MAX_LENGTH)
      newErrors.content = `Content exceeds ${POST_CONTENT_MAX_LENGTH} characters`;
    if (form.platforms.length === 0) newErrors.platforms = 'Select at least one platform';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : 'Failed to save post' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Edit Post' : 'Create New Post'}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={POST_TITLE_MAX_LENGTH}
              placeholder="Post title..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={5}
              maxLength={POST_CONTENT_MAX_LENGTH}
              placeholder="Write your post content..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
            <div className="flex justify-between mt-1">
              {errors.content && <p className="text-xs text-red-600">{errors.content}</p>}
              <p className="text-xs text-gray-400 ml-auto">
                {form.content.length}/{POST_CONTENT_MAX_LENGTH}
              </p>
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Platforms *</label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(SOCIAL_PLATFORMS) as [SocialPlatform, { label: string; color: string }][]).map(
                ([key, { label, color }]) => {
                  const isSelected = form.platforms.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => togglePlatform(key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                        isSelected
                          ? 'text-white border-transparent'
                          : 'text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                      style={isSelected ? { backgroundColor: color } : undefined}
                    >
                      {label}
                    </button>
                  );
                }
              )}
            </div>
            {errors.platforms && <p className="text-xs text-red-600 mt-1">{errors.platforms}</p>}
          </div>

          {/* Media Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Media Type</label>
            <select
              value={form.mediaType}
              onChange={(e) => setForm({ ...form, mediaType: e.target.value as MediaType })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="carousel">Carousel</option>
              <option value="story">Story</option>
              <option value="reel">Reel</option>
            </select>
          </div>

          {/* Media URLs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-1">
                <Image className="h-4 w-4" /> Media URLs
              </span>
            </label>
            <input
              type="text"
              value={form.mediaUrls.join(', ')}
              onChange={(e) =>
                setForm({
                  ...form,
                  mediaUrls: e.target.value
                    .split(',')
                    .map((u) => u.trim())
                    .filter(Boolean),
                })
              }
              placeholder="Comma-separated image/video URLs..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter URLs separated by commas. Media upload will be available in a future release.
            </p>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> Schedule For
              </span>
            </label>
            <input
              type="datetime-local"
              value={
                form.scheduledFor
                  ? new Date(form.scheduledFor.getTime() - form.scheduledFor.getTimezoneOffset() * 60000)
                      .toISOString()
                      .slice(0, 16)
                  : ''
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  scheduledFor: e.target.value ? new Date(e.target.value) : undefined,
                })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <p className="text-xs text-gray-400 mt-1">
              Leave empty to save as draft
            </p>
          </div>

          {/* Campaign Link */}
          {campaigns.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link to Campaign (optional)
              </label>
              <select
                value={form.campaignId || ''}
                onChange={(e) => setForm({ ...form, campaignId: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">No campaign</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add a tag..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 text-sm text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors"
              >
                Add
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
                  >
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {errors.submit}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEditing ? 'Update Post' : form.scheduledFor ? 'Schedule Post' : 'Save Draft'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SocialPostForm;
