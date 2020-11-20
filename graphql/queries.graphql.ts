import gql from 'graphql-tag';

export const AllUsersQuery = gql`
  query AllUsers {
    allUsers {
      id
      name
    }
  }
`;
