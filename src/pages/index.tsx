import Link from "next/link";
import { GetStaticProps } from "next";
import {
  Box,
  Heading,
  HStack,
  Badge,
  Text,
  SimpleGrid,
  Link as ChakraLink,
  Icon,
} from "@chakra-ui/react";
import {
  IoArrowForward,
  IoBookOutline,
  IoSchoolOutline,
  IoTimeOutline,
} from "react-icons/io5";
import { useColorModeValue } from "@/components/ui/color-mode";
import Main from "@/components/layouts/main";
import Cover from "@/components/cover";
import { getAllArticles, getAllCourses } from "@/lib/content";

export default function Home({
  articles,
  courses,
}: {
  articles: ReturnType<typeof getAllArticles>;
  courses: ReturnType<typeof getAllCourses>;
}) {
  const cardBg = useColorModeValue("whiteAlpha.500", "whiteAlpha.200");
  const cardHoverBg = useColorModeValue("whiteAlpha.700", "whiteAlpha.300");
  const muted = useColorModeValue("gray.500", "whiteAlpha.600");

  return (
    <Main>
      <Box mb={10}>
        <Text fontSize="sm" color={muted} mb={1}>
          Nanpipat Klinpratoom
        </Text>
        <Heading as="h1" size="2xl" mb={3}>
          Artifacts
        </Heading>
        <Text fontSize="lg" color={muted}>
          บทความ คอร์ส และสไลด์ จากการเรียนรู้และการสอน รวมไว้ที่เดียว
        </Text>
      </Box>

      <SectionHeading title="Courses" href="/courses" />
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} mb={12}>
        {courses.map((course) => (
          <ChakraLink
            as={Link}
            href={`/courses/${course.slug}`}
            key={course.slug}
            _hover={{ textDecoration: "none" }}
          >
            <Box
              borderRadius="lg"
              bg={cardBg}
              overflow="hidden"
              transition="all 0.3s"
              _hover={{ bg: cardHoverBg, transform: "translateY(-4px)", boxShadow: "lg" }}
              height="100%"
            >
              <Cover src={course.cover} alt={course.title} fallbackIcon={IoSchoolOutline} />
              <Box p={5}>
                <HStack mb={2} flexWrap="wrap" gap={2}>
                  {course.level && (
                    <Badge colorPalette="teal" borderRadius="full">
                      {course.level}
                    </Badge>
                  )}
                  <Text fontSize="xs" color={muted}>
                    {course.decks.length} deck{course.decks.length === 1 ? "" : "s"}
                    {course.materials.length > 0
                      ? ` · ${course.materials.length} material${course.materials.length === 1 ? "" : "s"}`
                      : ""}
                  </Text>
                </HStack>
                <Heading as="h3" size="md" mb={2}>
                  {course.title}
                </Heading>
                <Text fontSize="sm" color={muted} lineClamp={3}>
                  {course.summary}
                </Text>
              </Box>
            </Box>
          </ChakraLink>
        ))}
      </SimpleGrid>

      <SectionHeading title="Latest Articles" href="/articles" />
      <Box>
        {articles.slice(0, 5).map((article) => (
          <ChakraLink
            as={Link}
            href={`/articles/${article.slug}`}
            key={article.slug}
            _hover={{ textDecoration: "none" }}
          >
            <Box
              display={{ base: "block", md: "flex" }}
              borderRadius="lg"
              bg={cardBg}
              overflow="hidden"
              transition="all 0.3s"
              _hover={{ bg: cardHoverBg }}
              mb={3}
            >
              <Box width={{ base: "100%", md: "240px" }} flexShrink={0}>
                <Cover src={article.cover} alt={article.title} fallbackIcon={IoBookOutline} />
              </Box>
              <Box p={4}>
                <HStack fontSize="xs" color={muted} mb={1} flexWrap="wrap" gap={2}>
                  <HStack gap={1}>
                    <Icon as={IoTimeOutline} />
                    <Text>{article.date}</Text>
                  </HStack>
                  {article.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} colorPalette="teal" borderRadius="full">
                      {tag}
                    </Badge>
                  ))}
                </HStack>
                <Heading as="h3" size="sm" mb={1}>
                  {article.title}
                </Heading>
                <Text fontSize="sm" color={muted} lineClamp={2}>
                  {article.excerpt}
                </Text>
              </Box>
            </Box>
          </ChakraLink>
        ))}
      </Box>
    </Main>
  );
}

function SectionHeading({ title, href }: { title: string; href: string }) {
  return (
    <HStack justify="space-between" mb={4}>
      <Heading as="h2" size="lg">
        {title}
      </Heading>
      <ChakraLink as={Link} href={href} color="teal.500" fontSize="sm" display="inline-flex">
        <HStack gap={1}>
          <Text>View all</Text>
          <Icon as={IoArrowForward} />
        </HStack>
      </ChakraLink>
    </HStack>
  );
}

export const getStaticProps: GetStaticProps<{
  articles: ReturnType<typeof getAllArticles>;
  courses: ReturnType<typeof getAllCourses>;
}> = async () => {
  return { props: { articles: getAllArticles(), courses: getAllCourses() } };
};
