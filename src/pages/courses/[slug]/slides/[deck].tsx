import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { IoChevronBack } from "react-icons/io5";
import { getAllCourseSlugs, getCourse } from "@/lib/content";

interface SlidesPageProps {
  courseSlug: string;
  courseTitle: string;
  deckId: string;
  deckTitle: string;
  deckUrl: string;
}

export default function SlidesPage({
  courseSlug,
  courseTitle,
  deckId,
  deckTitle,
  deckUrl,
}: SlidesPageProps) {
  return (
    <Box height="100vh" display="flex" flexDirection="column">
      <Head>
        <title>{deckTitle} - Artifacts</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Flex
        as="header"
        align="center"
        justify="space-between"
        px={4}
        py={2}
        flexShrink={0}
        borderBottomWidth="1px"
        borderColor="whiteAlpha.200"
        gap={3}
      >
        <Button asChild variant="ghost" colorPalette="teal" size="sm">
          <Link href={`/courses/${courseSlug}`}>
            <IoChevronBack />
            {courseTitle}
          </Link>
        </Button>
        <Text
          fontSize="sm"
          fontWeight="bold"
          truncate
          display={{ base: "none", md: "block" }}
        >
          {deckTitle}
        </Text>
        <Button asChild size="sm" variant="outline" colorPalette="teal">
          <a href={deckUrl} target="_blank" rel="noopener">
            Open raw
          </a>
        </Button>
      </Flex>
      <Box flex={1} minH={0} bg="gray.900">
        <iframe
          src={deckUrl}
          title={deckTitle}
          allowFullScreen
          style={{ width: "100%", height: "100%", border: 0, display: "block" }}
        />
      </Box>
      <Text srOnly>Slide deck {deckId}</Text>
    </Box>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths: { params: { slug: string; deck: string } }[] = [];
  for (const slug of getAllCourseSlugs()) {
    const course = await getCourse(slug);
    for (const deck of course?.decks ?? []) {
      paths.push({ params: { slug, deck: deck.id } });
    }
  }
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<SlidesPageProps> = async ({
  params,
}) => {
  const slug = params?.slug as string;
  const deckId = params?.deck as string;
  const course = await getCourse(slug);
  const deck = course?.decks.find((d) => d.id === deckId);
  if (!course || !deck) return { notFound: true };
  return {
    props: {
      courseSlug: slug,
      courseTitle: course.title,
      deckId: deck.id,
      deckTitle: deck.title,
      deckUrl: deck.url,
    },
  };
};
