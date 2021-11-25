import * as cdk from '@aws-cdk/core';
import { Stack } from '../lib/stack';

const app = new cdk.App();

const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
};


const stack = new Stack(app, 'GraphqlQldbPlayground', {
    env
});