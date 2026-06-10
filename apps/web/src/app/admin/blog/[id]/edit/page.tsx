import { notFound } from "next/navigation";
import {
  getAdminBlogPostById,
  getAuthors,
  getCategories,
  getTags,
  getCities,
  getDishTypes,
} from "@/lib/admin/blog-queries";
import { BlogPostEditor } from "@/components/admin/blog/blog-post-editor";

type Params = Promise<{ id: string }>;

export default async function EditBlogPostPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const [post, authors, categories, tags, cities, dishTypes] =
    await Promise.all([
      getAdminBlogPostById(id),
      getAuthors(),
      getCategories(),
      getTags(),
      getCities(),
      getDishTypes(),
    ]);

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#ECEDEE]">Edit Blog Post</h1>
      <BlogPostEditor
        post={post}
        authors={authors}
        categories={categories}
        tags={tags}
        cities={cities}
        dishTypes={dishTypes}
      />
    </div>
  );
}
