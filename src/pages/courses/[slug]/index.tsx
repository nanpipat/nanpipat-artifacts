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
import { IoChevronBack, IoDownloadOutline, IoDocumentOutline, IoSchoolOutline } from "react-icons/io5";
import Main from "@/components/layouts/main";
import DeckPreview from "@/components/deck-preview";
import Cover from "@/components/cover";
import { proseCss } from "@/lib/prose";
import { getAllCourseSlugs, getAllCourses, getCourse } from "@/lib/content";

interface CoursePageProps {
  slug: string;
  title: string;
  level: string | null;
  tags: string[];
  updated: string | null;
  cover: string | null;
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
  cover,
  html,
  decks,
  materials,
}: CoursePageProps) {
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

      <Box mb={6}>
        <Cover src={cover} alt={title} fallbackIcon={IoSchoolOutline} />
      </Box>

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

      <Box css={proseCss} className="article-content" dangerouslySetInnerHTML={{ __html: html }} />

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
      cover: course.cover ?? null,
      html: course.html,
      decks: course.decks,
      materials: course.materials,
    },
  };
};
