import Link from "next/link";
import {
  Box,
  Button,
  Heading,
  HStack,
  Badge,
  Text,
  Icon,
  List,
} from "@chakra-ui/react";
import { useColorModeValue } from "@/components/ui/color-mode";
import { GetStaticPaths, GetStaticProps } from "next";
import { IoChevronBack, IoDownloadOutline, IoDocumentOutline } from "react-icons/io5";
import Main from "@/components/layouts/main";
import DeckPreview from "@/components/deck-preview";
import { getAllCourseSlugs, getAllCourses, getCourse } from "@/lib/content";

interface CoursePageProps {
  slug: string;
  title: string;
  level: string | null;
  tags: string[];
  updated: string | null;
  html: string;
  decks: {
    id: string;
    file: string;
    url: string;
    title: string;
    slides: number;
  }[];
  materials: {
    file: string;
    label: string;
    url: string;
    size: string;
  }[];
}

export default function CoursePage({
  slug,
  title,
  level,
  tags,
  updated,
  html,
  decks,
  materials,
}: CoursePageProps) {
  const contentBg = useColorModeValue("whiteAlpha.500", "whiteAlpha.200");
  const muted = useColorModeValue("gray.500", "whiteAlpha.600");
  const border = useColorModeValue("gray.200", "whiteAlpha.200");

  return (
    <Main width="768px" title={`${title} - Artifacts`}>
      <Button asChild variant="ghost" colorPalette="teal" size="sm" mb={6}>
        <Link href="/courses">
          <IoChevronBack />
          All Courses
        </Link>
      </Button>

      <HStack mb={2} flexWrap="wrap" gap={2}>
        {level && (
          <Badge colorPalette="teal" borderRadius="full">
            {level}
          </Badge>
        )}
        {tags.map((tag) => (
          <Badge key={tag} colorPalette="gray" borderRadius="full">
            {tag}
          </Badge>
        ))}
      </HStack>
      <Heading as="h1" size="xl" mb={6}>
        {title}
      </Heading>

      <Box
        p={8}
        borderRadius="lg"
        bg={contentBg}
        className="article-content"
        css={{
          "& h2": { fontSize: "xl", fontWeight: "bold", mb: 3, mt: 5 },
          "& h3": { fontSize: "lg", fontWeight: "bold", mb: 3, mt: 4 },
          "& p": { mb: 4, lineHeight: "1.8" },
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
          "& a": { color: "teal.500", textDecoration: "underline" },
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {decks.length > 0 && (
        <Box mt={10}>
          <Heading as="h2" size="lg" mb={2}>
            Slides
          </Heading>
          <Text color={muted} fontSize="sm" mb={5}>
            พรีวิวสไลด์ได้เลย หรือเปิดเต็มจอเพื่อดูแบบนำเสนอ
          </Text>
          {decks.map((deck) => (
            <Box key={deck.id} mb={6}>
              <DeckPreview courseSlug={slug} deck={deck} />
            </Box>
          ))}
        </Box>
      )}

      {materials.length > 0 && (
        <Box mt={10}>
          <Heading as="h2" size="lg" mb={2}>
            Materials
          </Heading>
          <Text color={muted} fontSize="sm" mb={5}>
            เอกสารและไฟล์ประกอบคอร์ส ดาวน์โหลดได้
          </Text>
          <List.Root gap={3}>
            {materials.map((m) => (
              <List.Item
                key={m.file}
                listStyleType="none"
                borderWidth="1px"
                borderColor={border}
                borderRadius="md"
                px={4}
                py={3}
              >
                <HStack justify="space-between" flexWrap="wrap" gap={2}>
                  <HStack gap={3}>
                    <Icon as={IoDocumentOutline} color="teal.500" />
                    <Box>
                      <Text fontWeight="medium" textTransform="capitalize">
                        {m.label}
                      </Text>
                      <Text fontSize="xs" color={muted}>
                        {m.file} · {m.size}
                      </Text>
                    </Box>
                  </HStack>
                  <Button asChild size="xs" colorPalette="teal" variant="outline">
                    <a href={m.url} download>
                      <IoDownloadOutline />
                      Download
                    </a>
                  </Button>
                </HStack>
              </List.Item>
            ))}
          </List.Root>
        </Box>
      )}

      {updated && (
        <Text fontSize="xs" color={muted} mt={10}>
          Last updated: {updated}
        </Text>
      )}
    </Main>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllCourseSlugs().map((slug) => ({ params: { slug } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<CoursePageProps> = async ({
  params,
}) => {
  const slug = params?.slug as string;
  const course = await getCourse(slug);
  if (!course) return { notFound: true };
  return {
    props: {
      slug: course.slug,
      title: course.title,
      level: course.level ?? null,
      tags: course.tags,
      updated: course.updated ?? null,
      html: course.html,
      decks: course.decks,
      materials: course.materials,
    },
  };
};
