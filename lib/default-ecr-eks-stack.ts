import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {
    ContractsCrossRefConsumer,
    ContractsEnverCdk, ContractsEnverCdkDefaultEcrEks, EksManifest
} from "@ondemandenv/odmd-contracts";
import {Deployment, Ingress, Service} from "cdk8s-plus-28";
import {App, Chart} from "cdk8s";


export class DefaultEcrEksStack extends cdk.Stack {

    constructor(scope: Construct, m: ContractsEnverCdkDefaultEcrEks, props?: cdk.StackProps) {
        const revStr = m.targetRevision.type == 'b' ? m.targetRevision.value : m.targetRevision.toString();
        super(scope, ContractsEnverCdk.SANITIZE_STACK_NAME(`${m.owner.buildId}--${revStr}`), props);

        const chart = new Chart(new App(), 'theChart')

        m.simpleK8s.deployment.containers?.forEach(c => {
            if (c.image.startsWith('OdmdRefConsumer:')) {
                const csmr = ContractsCrossRefConsumer.fromOdmdRef(c.image)
                const cfnRef = m.userEnver.getSharedValue(this, csmr.producer)

                // @ts-ignore
                c.image = cfnRef
            }
        })

        new Deployment(chart, 'deploy', m.simpleK8s.deployment)

        if (m.simpleK8s.ingress) {
            new Ingress(chart, 'ingress', m.simpleK8s.ingress)
        }
        if (m.simpleK8s.service) {
            new Service(chart, 'service', m.simpleK8s.service)
        }


        new EksManifest(this, 'd-i-s', {
            manifest: chart,
            enver: m,
            k8sNamespace: m.simpleK8s.targetNamespace,
            targetEksCluster: m.simpleK8s.targetEksCluster
        });

    }
}
