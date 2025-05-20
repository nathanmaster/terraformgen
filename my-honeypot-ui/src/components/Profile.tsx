import React from 'react';
import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react';
import { LoadingPage } from './LoadingPage';

const Profile = () => {
  const { user, isLoading, error } = useAuth0();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error) {
    return <div>Error loading profile: {error.message}</div>;
  }

  return (
    <div>
      {user ? (
        <>
          <h1>Profile</h1>
          <p>Name: {user.name}</p>
          <p>Email: {user.email}</p>
          {/* Add more user info as needed */}
        </>
      ) : (
        <p>No user profile found.</p>
      )}
    </div>
  );
};

export default withAuthenticationRequired(Profile, {
  onRedirecting: () => <LoadingPage />,
});
