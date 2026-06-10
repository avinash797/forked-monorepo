"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TipTapEditor } from "./tiptap-editor";
import { ImageUpload } from "./image-upload";
import type { JSONContent } from "@tiptap/react";
import type { Json } from "@/types/database.types";
import type { AdminBlogPostDetail } from "@/lib/admin/blog-queries";

type DropdownOption = { id: string; name: string; slug?: string };

type BlogPostEditorProps = {
  post?: AdminBlogPostDetail | null;
  authors: DropdownOption[];
  categories: DropdownOption[];
  tags: DropdownOption[];
  cities: DropdownOption[];
  dishTypes: DropdownOption[];
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function BlogPostEditor({
  post,
  authors,
  categories,
  tags,
  cities,
  dishTypes,
}: BlogPostEditorProps) {
  const router = useRouter();
  const isEditing = !!post;

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [autoSlug, setAutoSlug] = useState(!isEditing);
  const [content, setContent] = useState<JSONContent | null>(
    post?.content as JSONContent | null,
  );
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [authorId, setAuthorId] = useState(post?.author_id ?? "");
  const [categoryId, setCategoryId] = useState(post?.category_id ?? "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    post?.blog_post_tags?.map((t) => t.blog_tag_id) ?? [],
  );
  const [cityId, setCityId] = useState(post?.city_id ?? "");
  const [dishTypeId, setDishTypeId] = useState(post?.dish_type_id ?? "");
  const [featuredImage, setFeaturedImage] = useState(
    post?.featured_image_url ?? "",
  );
  const [seoTitle, setSeoTitle] = useState(post?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(
    post?.seo_description ?? "",
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [imageUploadTarget, setImageUploadTarget] = useState<
    "featured" | "inline"
  >("featured");

  // Store inline image callback
  const [inlineImageCallback, setInlineImageCallback] = useState<
    ((url: string) => void) | null
  >(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (autoSlug) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setAutoSlug(false);
    setSlug(slugify(value));
  }

  const handleInlineImageRequest = useCallback(() => {
    setImageUploadTarget("inline");
    setShowImageUpload(true);
  }, []);

  function handleImageUploaded(url: string) {
    if (imageUploadTarget === "featured") {
      setFeaturedImage(url);
    } else if (inlineImageCallback) {
      inlineImageCallback(url);
      setInlineImageCallback(null);
    }
    setShowImageUpload(false);
  }

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
    );
  }

  async function handleSave(status: "draft" | "published") {
    if (!title.trim() || !slug.trim() || !authorId || !categoryId) {
      setError("Title, slug, author, and category are required.");
      return;
    }

    setSaving(true);
    setError(null);

    const supabase = createClient();

    const postData = {
      title: title.trim(),
      slug: slug.trim(),
      content: content as unknown as Json,
      excerpt: excerpt.trim() || null,
      author_id: authorId,
      category_id: categoryId,
      city_id: cityId || null,
      dish_type_id: dishTypeId || null,
      featured_image_url: featuredImage || null,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDescription.trim() || null,
      status,
      published_at:
        status === "published"
          ? (post?.published_at ?? new Date().toISOString())
          : null,
    };

    let postId = post?.id;

    if (isEditing && postId) {
      const { error: updateError } = await supabase
        .from("blog_posts")
        .update(postData)
        .eq("id", postId);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { data: newPost, error: insertError } = await supabase
        .from("blog_posts")
        .insert(postData)
        .select("id")
        .single();

      if (insertError || !newPost) {
        setError(insertError?.message ?? "Failed to create post.");
        setSaving(false);
        return;
      }
      postId = newPost.id;
    }

    // Update tags: delete existing, insert new
    await supabase.from("blog_post_tags").delete().eq("blog_post_id", postId);
    if (selectedTags.length > 0) {
      await supabase.from("blog_post_tags").insert(
        selectedTags.map((tagId) => ({
          blog_post_id: postId,
          blog_tag_id: tagId,
        })),
      );
    }

    setSaving(false);
    router.push("/admin/blog");
    router.refresh();
  }

  async function handleDelete() {
    if (!post?.id) return;
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    setSaving(true);
    const supabase = createClient();

    await supabase.from("blog_post_tags").delete().eq("blog_post_id", post.id);
    const { error: deleteError } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", post.id);

    if (deleteError) {
      setError(deleteError.message);
      setSaving(false);
      return;
    }

    router.push("/admin/blog");
    router.refresh();
  }

  return (
    <>
      {showImageUpload && (
        <ImageUpload
          onUpload={handleImageUploaded}
          onClose={() => setShowImageUpload(false)}
        />
      )}

      <div className="space-y-6">
        {error && (
          <div className="rounded-sm bg-danger/10 border border-danger/30 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Main content */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full rounded-sm border border-input-border bg-input-bg px-4 py-2.5 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-focus-ring"
                placeholder="Post title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className="w-full rounded-sm border border-input-border bg-input-bg px-4 py-2.5 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-focus-ring font-mono text-sm"
                placeholder="post-slug"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Content
              </label>
              <TipTapEditor
                content={content}
                onChange={setContent}
                onImageUploadRequest={handleInlineImageRequest}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Excerpt
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                className="w-full rounded-sm border border-input-border bg-input-bg px-4 py-2.5 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-focus-ring resize-y"
                placeholder="Brief summary for previews..."
              />
            </div>
          </div>

          {/* Right: Metadata sidebar */}
          <div className="space-y-4">
            {/* Author */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Author
              </label>
              <select
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                className="w-full rounded-sm border border-input-border bg-input-bg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
              >
                <option value="">Select author...</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-sm border border-input-border bg-input-bg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 text-xs rounded-pill transition-colors cursor-pointer ${
                      selectedTags.includes(tag.id)
                        ? "bg-accent text-white"
                        : "bg-surface-2 text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
                {tags.length === 0 && (
                  <p className="text-xs text-text-secondary">
                    No tags available.
                  </p>
                )}
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                City (optional)
              </label>
              <select
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                className="w-full rounded-sm border border-input-border bg-input-bg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
              >
                <option value="">None</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dish Type */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Dish Type (optional)
              </label>
              <select
                value={dishTypeId}
                onChange={(e) => setDishTypeId(e.target.value)}
                className="w-full rounded-sm border border-input-border bg-input-bg px-4 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-focus-ring"
              >
                <option value="">None</option>
                {dishTypes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Featured Image */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Featured Image
              </label>
              {featuredImage ? (
                <div className="relative">
                  <img
                    src={featuredImage}
                    alt="Featured"
                    className="w-full h-32 object-cover rounded-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setFeaturedImage("")}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs cursor-pointer hover:bg-black/80"
                  >
                    x
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setImageUploadTarget("featured");
                    setShowImageUpload(true);
                  }}
                  className="w-full rounded-sm border-2 border-dashed border-input-border py-6 text-sm text-text-secondary hover:border-accent/50 transition-colors cursor-pointer"
                >
                  Upload image
                </button>
              )}
            </div>

            {/* SEO Fields */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                SEO Title
              </label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full rounded-sm border border-input-border bg-input-bg px-4 py-2.5 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-focus-ring text-sm"
                placeholder="Override page title for SEO"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                SEO Description
              </label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={2}
                className="w-full rounded-sm border border-input-border bg-input-bg px-4 py-2.5 text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-focus-ring resize-y text-sm"
                placeholder="Meta description for search engines"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="px-5 py-2.5 rounded-sm bg-surface-2 text-text-primary font-medium hover:bg-surface-3 disabled:opacity-45 transition-colors cursor-pointer"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={() => handleSave("published")}
            disabled={saving}
            className="px-5 py-2.5 rounded-sm bg-accent text-white font-medium hover:brightness-110 disabled:opacity-45 transition-all cursor-pointer"
          >
            {saving ? "Publishing..." : "Publish"}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="ml-auto px-5 py-2.5 rounded-sm text-danger font-medium hover:bg-danger/10 disabled:opacity-45 transition-colors cursor-pointer"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </>
  );
}
