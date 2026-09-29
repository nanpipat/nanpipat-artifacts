import Link from "next/link";
import {
  Box,
  Heading,
  HStack,
  Badge,
  Text,
  Link as ChakraLink,
  Icon,
} from "@chakra-ui/react";
import { useColorModeValue } from "@/components/ui/color-mode";
import { IoBookOutline, IoTimeOutline } from "react-icons/io5";
import { GetStaticProps } from "next";
import Main from "@/components/layouts/main";
import Cover from "@/components/cover";
import { getAllArticles, Article } from "@/lib/content";

interface ArticlesProps {
  articles: Article[];
}

export default function Articles({ articles }: ArticlesProps) {
  const cardBg = useColorModeValue("whiteAlpha.500", "whiteAlpha.200");
  const cardHoverBg = useColorModeValue("whiteAlpha.700", "whiteAlpha.300");
  const muted = useColorModeValue("gray.500", "whiteAlpha.600");

  return (
    <Main width="768px" title="Articles - Artifacts">
      <Heading as="h1" size="2xl" mb={8}>
        Articles
      </Heading>
      {articles.length === 0 ? (
        <Text color={muted}>No articles yet.</Text>
      ) : (
        articles.map((article) => (
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
              mb={4}
            >
              <Box width={{ base: "100%", md: "220px" }} flexShrink={0}>
                <Cover src={article.cover} alt={article.title} fallbackIcon={IoBookOutline} />
              </Box>
              <Box p={5}>
                <HStack fontSize="xs" color={muted} mb={1} flexWrap="wrap" gap={2}>
                  <HStack gap={1}>
                    <Icon as={IoTimeOutline} />
                    <Text>{article.date}</Text>
                  </HStack>
                  {article.tags.map((tag) => (
                    <Badge key={tag} colorPalette="teal" borderRadius="full">
                      {tag}
                    </Badge>
                  ))}
                </HStack>
                <Heading as="h2" size="md" mb={1}>
                  {article.title}
                </Heading>
                <Text fontSize="sm" color={muted} lineClamp={2}>
                  {article.excerpt}
                </Text>
              </Box>
            </Box>
          </ChakraLink>
        ))
      )}
    </Main>
  );
}

export const getStaticProps: GetStaticProps<ArticlesProps> = async () => {
  return { props: { articles: getAllArticles() } };
};
