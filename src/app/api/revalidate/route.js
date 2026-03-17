import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req) {
  try {
    const { secret, slug, blogSlug, paths = [] } = await req.json();

    // security
    if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Static routes you told
    const staticRoutes = [
      "/",
      "/fabric",
      "/blog",
      "/contact",
      "/compatibilities",
      "/about",
      "/profile"
    ];

    staticRoutes.forEach((p) => revalidatePath(p));

    // ✅ Dynamic product page: /fabric/{slug}
    if (slug) revalidatePath(`/fabric/${slug}`);

    // ✅ Dynamic blog page: /blog-details/{slug}
    if (blogSlug) revalidatePath(`/blog-details/${blogSlug}`);

    // ✅ Optional: allow backend to send any extra paths
    if (Array.isArray(paths)) {
      paths.forEach((p) => typeof p === "string" && revalidatePath(p));
    }

    return NextResponse.json({
      ok: true,
      revalidated: {
        staticRoutes,
        product: slug ? `/fabric/${slug}` : null,
        blog: blogSlug ? `/blog-details/${blogSlug}` : null,
        extra: paths,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
