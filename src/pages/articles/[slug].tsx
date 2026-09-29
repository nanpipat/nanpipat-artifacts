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
import { IoChevronBack, IoOpenOutline } from "react-icons/io5";
import Main from "@/components/layouts/main";
import { getAllArticles, getArticle } from "@/lib/content";

interface ArticlePageProps {
  title: string;
  date: string;
  tags: string[];
  sourceUrl: string | null;
  html: string;
}

export default function ArticlePage({
  title,
  date,
  tags,
  sourceUrl,
  html,
}: ArticlePageProps) {
  const contentBg = useColorModeValue("whiteAlpha.500", "whiteAlpha.200");
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

      <Box
        p={8}
        borderRadius="lg"
        bg={contentBg}
        className="article-content"
        css={{
          "& h1": { fontSize: "2xl", fontWeight: "bold", mb: 4, mt: 6 },
          "& h2": { fontSize: "xl", fontWeight: "bold", mb: 3, mt: 5 },
          "& h3": { fontSize: "lg", fontWeight: "bold", mb: 3, mt: 4 },
          "& p": { mb: 4, lineHeight: "1.8" },
          "& img": { maxWidth: "100%", borderRadius: "md", mb: 4 },
          "& ul, & ol": { mb: 4, pl: 6 },
          "& li": { mb: 2, lineHeight: "1.7" },
          "& pre": {
            bg: useColorModeValue("gray.100", "gray.900"),
            p: 4,
            borderRadius: "md",
            overflow: "auto",
            mb: 4,
          },
          "& code": {
            bg: useColorModeValue("gray.100", "gray.900"),
            px: 2,
            py: 1,
            borderRadius: "sm",
            fontSize: "sm",
          },
          "& pre code": { bg: "transparent", p: 0 },
          "& blockquote": {
            borderLeft: "4px solid",
            borderColor: "teal.500",
            pl: 4,
            py: 2,
            fontStyle: "italic",
            mb: 4,
          },
          "& a": { color: "teal.500", textDecoration: "underline" },
          "& table": { width: "100%", mb: 4, borderCollapse: "collapse", display: "table" },
          "& th": {
            border: "1px solid",
            borderColor: useColorModeValue("gray.300", "gray.600"),
            px: 4,
            py: 2,
            textAlign: "left",
            fontWeight: "bold",
          },
          "& td": {
            border: "1px solid",
            borderColor: useColorModeValue("gray.300", "gray.600"),
            px: 4,
            py: 2,
          },
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
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
      sourceUrl: article.sourceUrl ?? null,
      html,
    },
  };
};
