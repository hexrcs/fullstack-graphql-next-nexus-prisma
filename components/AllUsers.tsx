import React from 'react';
import { useAllUsersQuery } from '../generated/graphql';

const AllUsers: React.FC = () => {
  const [result] = useAllUsersQuery();
  const { data, fetching, error } = result;
  if (fetching) return <p>Loading...</p>;
  if (error) return <p>Oh no... {error.message}</p>;
  return (
    <div>
      <p>There are {data?.allUsers?.length} user(s) in the database:</p>
      <ul>
        {data?.allUsers?.map(user => (
          <li key={user?.id}>{user?.name}</li>
        ))}
      </ul>
    </div>
  );
};
export default AllUsers;
