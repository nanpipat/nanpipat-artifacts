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
import { proseCss } from "@/lib/prose";
import { getAllArticles, getArticle } from "@/lib/content";

interface ArticlePageProps {
  title: string;
  date: string;
  tags: string[];
  cover: string | null;
  sourceUrl: string | null;
  html: string;
}

export default function ArticlePage({
  title,
  date,
  tags,
  cover,
  sourceUrl,
  html,
}: ArticlePageProps) {
  const muted = useColorModeValue("gray.500", "whiteAlpha.600");

  return (
    <Main width="768px" title={`${title} - Artifacts`}>
      <Head>
        <meta name="description" content={title} />
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
      title: article.title,
      date: article.date,
      tags: article.tags,
      cover: article.cover ?? null,
      sourceUrl: article.sourceUrl ?? null,
      html,
    },
  };
};
