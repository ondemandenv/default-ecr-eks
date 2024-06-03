import * as cdk from 'aws-cdk-lib';
import {RemovalPolicy} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {ContractsEnverCdk, ContractsEnverCdkDefaultEcrEks, EksManifest} from "@ondemandenv/odmd-contracts";
import {Deployment, Ingress, Service} from "cdk8s-plus-28";
import {App, Chart} from "cdk8s";
import {Bucket} from "aws-cdk-lib/aws-s3";


export class DefaultEcrEksStack extends cdk.Stack {

    constructor(scope: Construct, m: ContractsEnverCdkDefaultEcrEks, props?: cdk.StackProps) {
        const revStr = m.targetRevision.type == 'b' ? m.targetRevision.value : m.targetRevision.toString();
        super(scope, ContractsEnverCdk.SANITIZE_STACK_NAME(`${m.owner.buildId}--${revStr}`), props);

        const chart = new Chart(new App(), 'theChart')

        // @ts-ignore
        m.simpleK8s.deployment.containers![0]!.envVariables = {}
        m.simpleK8s.deployment.containers![0]!.envVariables!['tmp-bucket-tst'] = {value: new Bucket(this, 'tmp-tst', {removalPolicy: RemovalPolicy.DESTROY}).bucketName}

        new Deployment(chart, 'deploy', m.simpleK8s.deployment)

        if (m.simpleK8s.ingress) {
            new Ingress(chart, 'ingress', m.simpleK8s.ingress)
        }
        if (m.simpleK8s.service) {
            new Service(chart, 'service', m.simpleK8s.service)
        }


        new EksManifest(this, 'eks-manifest', {
            manifest: chart,
            enver: m,
            k8sNamespace: m.simpleK8s.targetNamespace,
            targetEksCluster: m.simpleK8s.targetEksCluster,
            skipValidate: true,
            pruneLabels: 'a=b',
            overWrite: true
        });

    }
}
