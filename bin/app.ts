#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {DefaultEcrEksStack} from '../lib/default-ecr-eks-stack';
import {OndemandContracts} from "@ondemandenv/odmd-contracts";
import {StackProps} from "aws-cdk-lib";

const app = new cdk.App();
new OndemandContracts(app)


const buildRegion = process.env.CDK_DEFAULT_REGION;
const buildAccount = process.env.CDK_DEFAULT_ACCOUNT
    ? process.env.CDK_DEFAULT_ACCOUNT
    : process.env.CODEBUILD_BUILD_ARN!.split(":")[4];
if (!buildRegion || !buildAccount) {
    throw new Error("buildRegion>" + buildRegion + "; buildAccount>" + buildAccount)
}

const props = {
    env: {
        account: buildAccount,
        region: buildRegion
    }
} as StackProps;

const allMyEnvers = OndemandContracts.inst.defaultEcrEks.envers

const m = allMyEnvers.find(e => e.targetRevision.toString() == OndemandContracts.REV_REF_value)!;

if (!m) {
    throw new Error('no enver found!')
}

new DefaultEcrEksStack(app, m, props);