import React from 'react';
import { Grid, TextField, Button, FormHelperText } from '@material-ui/core';
import { Formik } from 'formik';
import * as Yup from 'yup';

export default function Login(props) {
  return (
    <div style={{ padding: 16 }}>
      <Grid
        container
        spacing={3}
        style={{ padding: 16, borderRadius: 8, marginTop: 40 }}
      >
        <Grid item xs={12} md={6}>
          {/* <img
            style={{ width: '90%' }}
            src="/companies/shubhlife/login-screen.svg"
            alt="logo"
          /> */}
        </Grid>
        <Grid item xs={12} md={6}>
          {/* <img src="/companies/shubhlife/shubhlife-logo.svg" alt="logo" /> */}
          <Formik
            initialValues={{ email: '', password: '' }}
            validationSchema={() =>
              Yup.object({
                email: Yup.string()
                  .email()
                  .required('Email is required'),
                password: Yup.string().required('Password is required')
              })
            }
            onSubmit={values => {
              console.log(values);
            }}
            render={({ values, handleChange, handleBlur, errors, touched }) => {
              return (
                <form noValidate action="/login" method="post">
                  <TextField
                    label="Email"
                    placeholder="email"
                    fullWidth
                    name="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={!!errors.email}
                    helperText={touched.email && errors.email}
                  />
                  <br />
                  <br />
                  <TextField
                    label="Password"
                    placeholder="password"
                    name="password"
                    type="password"
                    fullWidth
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={!!errors.password}
                    helperText={touched.password && errors.password}
                  />
                  <br />
                  <br />
                  {props.error && (
                    <FormHelperText
                      style={{
                        textAlign: 'center'
                      }}
                      error={true}
                    >
                      {props.error[0]}
                    </FormHelperText>
                  )}
                  <br />
                  <Button type="submit" variant="outlined" color="primary">
                    Login
                  </Button>
                </form>
              );
            }}
          />
        </Grid>
      </Grid>
    </div>
  );
}

Login.getInitialProps = ({ req }: any) => {
  return {
    error: req.flash().error
  };
};
