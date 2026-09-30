import Head from "next/head";
import Link from "next/link";
import {
  Box,
  Button,
  Separator,
  HStack,
  Heading,
  Text,
  Badge,
} from "@chakra-ui/react";
import { useColorModeValue } from "@/components/ui/color-mode";
import { GetStaticPaths, GetStaticProps } from "next";
import { IoBookOutline, IoChevronBack, IoOpenOutline } from "react-icons/io5";
import Main from "@/components/layouts/main";
import Cover from "@/components/cover";
import ShareButtons from "@/components/share-buttons";
import { proseCss } from "@/lib/prose";
import { getAllArticles, getArticle } from "@/lib/content";

const SITE_URL = "https://artifacts.nanpipat.top";

interface ArticlePageProps {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
  cover: string | null;
  sourceUrl: string | null;
  html: string;
}

export default function ArticlePage({
  slug,
  title,
  date,
  tags,
  excerpt,
  cover,
  sourceUrl,
  html,
}: ArticlePageProps) {
  const muted = useColorModeValue("gray.500", "whiteAlpha.600");
  const pageUrl = `${SITE_URL}/articles/${slug}`;
  const ogImage = `${SITE_URL}/api/og?title=${encodeURIComponent(title)}&tag=article&date=${date}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    datePublished: date,
    author: { "@type": "Person", name: "Nanpipat Klinpratoom" },
    mainEntityOfPage: pageUrl,
    image: ogImage,
  };

  return (
    <Main width="768px" title={`${title} - Artifacts`}>
      <Head>
        <meta name="description" content={excerpt} />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Artifacts" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={excerpt} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="article:published_time" content={date} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={excerpt} />
        <meta name="twitter:image" content={ogImage} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>
      <Box mb={6}>
        <Button asChild variant="ghost" colorPalette="teal" size="sm" mb={6}>
          <Link href="/articles">
            <IoChevronBack />
            All Articles
          </Link>
        </Button>

        <Box mb={5}>
          <Cover src={cover} alt={title} fallbackIcon={IoBookOutline} />
        </Box>

        <HStack fontSize="xs" color={muted} mb={2} flexWrap="wrap" gap={2}>
          <Text>{date}</Text>
          {tags.map((tag) => (
            <Badge key={tag} colorPalette="teal" borderRadius="full">
              {tag}
            </Badge>
          ))}
        </HStack>
        <Heading as="h1" size="xl" mb={2}>
          {title}
        </Heading>
        {sourceUrl && (
          <Button asChild variant="plain" colorPalette="teal" size="xs">
            <a href={sourceUrl} target="_blank" rel="noopener">
              <IoOpenOutline />
              Read on Medium
            </a>
          </Button>
        )}
        <HStack justify="space-between" mt={3} mb={1} flexWrap="wrap" gap={3}>
          <Text fontSize="xs" color={muted}>
            แชร์บทความนี้
          </Text>
          <ShareButtons path={`/articles/${slug}`} />
        </HStack>
        <Separator my={5} />
      </Box>

      <Box css={proseCss} className="article-content" dangerouslySetInnerHTML={{ __html: html }} />
    </Main>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllArticles().map((a) => ({ params: { slug: a.slug } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<ArticlePageProps> = async ({
  params,
}) => {
  const slug = params?.slug as string;
  const result = await getArticle(slug);
  if (!result) return { notFound: true };
  const { article, html } = result;
  return {
    props: {
      slug,
      title: article.title,
      date: article.date,
      tags: article.tags,
      excerpt: article.excerpt,
      cover: article.cover ?? null,
      sourceUrl: article.sourceUrl ?? null,
      html,
    },
  };
};
