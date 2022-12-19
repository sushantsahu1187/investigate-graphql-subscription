import { useState, useEffect } from "react";
import styles from "../styles/Home.module.css";
import { ApolloProvider, useSubscription } from "@apollo/client";
import { client } from "../apollo/";
import { gql } from "graphql-tag";

export default function Home() {
  let [value, setValue] = useState(0);

  const GQL_SUBSCRIPTION = gql`
    subscription Subscription {
      userRegistered {
        id
        name
      }
    }
  `;

  function LatestSubscription() {
    const { data, loading } = useSubscription(GQL_SUBSCRIPTION);
    console.log(data);
    return <h4>New subscription: {!loading && data.userRegistered.name} </h4>;
  }

  return (
    <div>
      <ApolloProvider client={client}>
        <div className={styles.container}>
          <h1>Hello Graphql Subscription</h1>
          <LatestSubscription />
        </div>
      </ApolloProvider>
    </div>
  );
}
