import React from 'react';
import App, { Container } from 'next/app';
import Head from 'next/head';
import { ThemeProvider } from '@material-ui/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import { ApolloProvider } from '@apollo/react-common';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import nextCookie from 'next-cookies';
import cookie from 'js-cookie';
import '../node_modules/react-vis/dist/style.css';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@material-ui/core';
import { theme } from '../lib/theme';
import withApolloClient from '../lib/with-apollo-client';

export const AppContext = React.createContext({
  width: 0,
  height: 0,
  showAlert: (_message: string) => {}
});

class MyApp extends App<
  any,
  any,
  { height: number; width: number; alertMessage: string }
> {
  static async getInitialProps({ ctx, ctx: { res, err }, Component }: any) {
    const statusCode = res ? res.statusCode : err ? err.statusCode : null;
    const pageProps = Component.getInitialProps
      ? await Component.getInitialProps(ctx)
      : {};
    const { windowHeight, windowWidth } = nextCookie(ctx);
    return { statusCode, pageProps, windowHeight, windowWidth } as any;
  }

  constructor(props: any) {
    super(props);
    this.state = {
      width: this.props.windowWidth,
      height: this.props.windowHeight,
      alertMessage: ''
    };
  }

  handleResize = () => {
    cookie.set('windowHeight', window.innerHeight.toString());
    cookie.set('windowWidth', window.innerWidth.toString());
    this.setState({
      width: window.innerWidth,
      height: window.innerHeight
    });
  };

  componentDidMount() {
    // Remove the server-side injected CSS.
    const jssStyles: any = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentNode.removeChild(jssStyles);
    }

    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  render() {
    const { Component, pageProps, apolloClient } = this.props as any;

    return (
      <Container>
        <Head>
          <title>Parallel Learning</title>
        </Head>
        <ThemeProvider theme={theme}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          <AppContext.Provider
            value={{
              height: this.state.height,
              width: this.state.width,
              showAlert: (alertMessage: string) =>
                this.setState({ alertMessage })
            }}
          >
            <ApolloProvider client={apolloClient}>
              <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <Dialog
                  open={!!this.state.alertMessage}
                  onClose={() => this.setState({ alertMessage: '' })}
                  aria-labelledby="alert-dialog-title"
                  aria-describedby="alert-dialog-description"
                >
                  <DialogTitle id="alert-dialog-title">
                    System Message
                  </DialogTitle>
                  <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                      {this.state.alertMessage}
                    </DialogContentText>
                  </DialogContent>
                  <DialogActions>
                    <Button
                      onClick={() => this.setState({ alertMessage: '' })}
                      color="primary"
                    >
                      OK
                    </Button>
                  </DialogActions>
                </Dialog>
                <Component {...pageProps} />
              </MuiPickersUtilsProvider>
            </ApolloProvider>
          </AppContext.Provider>
        </ThemeProvider>
      </Container>
    );
  }
}

export default withApolloClient(MyApp);
