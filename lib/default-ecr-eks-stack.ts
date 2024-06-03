import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {
    ContractsCrossRefConsumer,
    ContractsEnverCdk,
    ContractsEnverCdkDefaultEcrEks,
    EksManifest
} from "@ondemandenv/odmd-contracts";
import {Deployment, Ingress, Service} from "cdk8s-plus-28";
import {App, Chart} from "cdk8s";


export class DefaultEcrEksStack extends cdk.Stack {

    constructor(scope: Construct, m: ContractsEnverCdkDefaultEcrEks, props?: cdk.StackProps) {
        const revStr = m.targetRevision.type == 'b' ? m.targetRevision.value : m.targetRevision.toString();
        super(scope, ContractsEnverCdk.SANITIZE_STACK_NAME(`${m.owner.buildId}--${revStr}`), props);

        const chart = new Chart(new App(), 'theChart')

        this.implementConsumerRef(m.simpleK8s.deployment)
        new Deployment(chart, 'deploy', m.simpleK8s.deployment)

        if (m.simpleK8s.ingress) {
            this.implementConsumerRef(m.simpleK8s.ingress)
            new Ingress(chart, 'ingress', m.simpleK8s.ingress)
        }
        if (m.simpleK8s.service) {
            this.implementConsumerRef(m.simpleK8s.service)
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

    private implementConsumerRef(obj: any) {
        for (const prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                const val = obj[prop]
                if (typeof val == 'string' && val.startsWith(ContractsCrossRefConsumer.OdmdRef_prefix)) {
                    obj[prop] = ContractsCrossRefConsumer.fromOdmdRef(val).getSharedValue(this)
                    console.log( val + ' >> ' + obj[prop])
                } else if (typeof obj[prop] === 'object' && obj[prop] !== null) {
                    this.implementConsumerRef(obj[prop]);
                }
            }
        }
    }
}
