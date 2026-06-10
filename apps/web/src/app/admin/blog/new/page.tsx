import {
  getAuthors,
  getCategories,
  getTags,
  getCities,
  getDishTypes,
} from "@/lib/admin/blog-queries";
import { BlogPostEditor } from "@/components/admin/blog/blog-post-editor";

export default async function NewBlogPostPage() {
  const [authors, categories, tags, cities, dishTypes] = await Promise.all([
    getAuthors(),
    getCategories(),
    getTags(),
    getCities(),
    getDishTypes(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#ECEDEE]">New Blog Post</h1>
      <BlogPostEditor
        authors={authors}
        categories={categories}
        tags={tags}
        cities={cities}
        dishTypes={dishTypes}
      />
    </div>
  );
}
