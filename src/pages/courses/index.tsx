import Link from "next/link";
import {
  Box,
  Heading,
  HStack,
  Badge,
  Text,
  SimpleGrid,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { useColorModeValue } from "@/components/ui/color-mode";
import { IoSchoolOutline } from "react-icons/io5";
import { GetStaticProps } from "next";
import Main from "@/components/layouts/main";
import Cover from "@/components/cover";
import { getAllCourses, Course } from "@/lib/content";

interface CoursesProps {
  courses: Course[];
}

export default function Courses({ courses }: CoursesProps) {
  const cardBg = useColorModeValue("whiteAlpha.500", "whiteAlpha.200");
  const cardHoverBg = useColorModeValue("whiteAlpha.700", "whiteAlpha.300");
  const muted = useColorModeValue("gray.500", "whiteAlpha.600");

  return (
    <Main title="Courses - Artifacts">
      <Heading as="h1" size="2xl" mb={3}>
        Courses
      </Heading>
      <Text color={muted} mb={8}>
        คอร์สและเวิร์กช็อป พร้อมสไลด์และเอกสารประกอบ ดูได้บนเว็บและโหลดได้
      </Text>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
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
                  {course.tags.map((tag) => (
                    <Badge key={tag} colorPalette="gray" borderRadius="full">
                      {tag}
                    </Badge>
                  ))}
                </HStack>
                <Heading as="h3" size="md" mb={2}>
                  {course.title}
                </Heading>
                <Text fontSize="sm" color={muted} lineClamp={3}>
                  {course.summary}
                </Text>
                <HStack fontSize="xs" color={muted} mt={3}>
                  <Text>
                    {course.decks.length} deck{course.decks.length === 1 ? "" : "s"}
                    {course.materials.length > 0
                      ? ` · ${course.materials.length} material${course.materials.length === 1 ? "" : "s"}`
                      : ""}
                  </Text>
                </HStack>
              </Box>
            </Box>
          </ChakraLink>
        ))}
      </SimpleGrid>
    </Main>
  );
}

export const getStaticProps: GetStaticProps<CoursesProps> = async () => {
  return { props: { courses: getAllCourses() } };
};
