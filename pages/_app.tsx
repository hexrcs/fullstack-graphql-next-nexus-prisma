import React from "react";
import { withUrqlClient } from "next-urql";
import { AppProps } from "next/app";
import fetch from "isomorphic-unfetch";

// the URL to /api/graphql
const GRAPHQL_ENDPOINT = `http://localhost:3000/api/graphql`;

const App = ({ Component, pageProps }: AppProps) => {
  return <Component {...pageProps} />;
};

export default withUrqlClient({ url: GRAPHQL_ENDPOINT, fetch })(
  App
);
