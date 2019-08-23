import React from 'react';
import initApollo from './init-apollo';
import Head from 'next/head';
import { getDataFromTree } from '@apollo/react-ssr';

export default (App: any) => {
  return class Apollo extends React.Component {
    static displayName = 'withApollo(App)';
    static async getInitialProps(ctx: any) {
      const { AppTree } = ctx;

      let appProps = {};
      if (App.getInitialProps) {
        appProps = await App.getInitialProps(ctx);
      }

      // Run all GraphQL queries in the component tree
      // and extract the resulting data
      const apollo = initApollo(null, ctx.ctx);
      if (typeof window === 'undefined') {
        try {
          // Run all GraphQL queries
          await getDataFromTree(
            <AppTree {...appProps} apolloClient={apollo} />
          );
        } catch (error) {
          // Prevent Apollo Client GraphQL errors from crashing SSR.
          // Handle them in components via the data.error prop:
          // https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-query-data-error
          console.error('Error while running `getDataFromTree`', error);
        }

        // getDataFromTree does not call componentWillUnmount
        // head side effect therefore need to be cleared manually
        Head.rewind();
      }

      // Extract query data from the Apollo store
      const apolloState = apollo.cache.extract();

      return {
        ...appProps,
        apolloState
      };
    }

    apolloClient: any;

    constructor(props: any) {
      super(props);
      this.apolloClient = initApollo(props.apolloState, undefined);
    }

    render() {
      return (
        <App {...this.props} apolloClient={this.apolloClient} {...this.props} />
      );
    }
  };
};
