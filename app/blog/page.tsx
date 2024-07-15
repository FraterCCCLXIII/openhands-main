import { getAllPosts } from "app/api/blog/post";
import Container from "app/blog/_components/container";
import { HeroPost } from "app/blog/_components/hero-post";
import { Intro } from "app/blog/_components/intro";
import { MoreStories } from "app/blog/_components/more-stories";

export default function Index() {
  const allPosts = getAllPosts();

  const heroPost = allPosts[0];

  if(!heroPost) {
    return <p>No posts found</p>;
  }

  const morePosts = allPosts.slice(1);

  return (
    <main>
      <Container>
        <Intro />
        <HeroPost
          title={heroPost.title}
          coverImage={heroPost.coverImage}
          date={heroPost.date}
          author={heroPost.author}
          slug={heroPost.slug}
          excerpt={heroPost.excerpt}
        />
        {morePosts.length > 0 && <MoreStories posts={morePosts} />}
      </Container>
    </main>
  );
}
