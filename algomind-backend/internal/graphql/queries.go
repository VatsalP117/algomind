package graphql

const LeetCodeGraphQLQuery = `
query getQuestionDetail($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    title
    difficulty
    content
    topicTags {
      name
      slug
    }
  }
}
`
