import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Deployment, Ingress, Service} from "cdk8s-plus-29";
import {App, Chart} from "cdk8s";
import {
    OdmdCrossRefProducer,
    OdmdCrossRefConsumer,
    OdmdEnverUserAuth,
    EksManifest,
    OdmdEnverCdk,
    OdmdShareOut,
    OdmdEnverCdkDefaultEcrEks
} from "@ondemandenv/contracts-lib-base";
import {KubernetesManifest} from "aws-cdk-lib/aws-eks";
import {OndemandContractsSandbox} from "@ondemandenv/odmd-contracts-sandbox";


export class DefaultEcrEksStack extends cdk.Stack {

    constructor(scope: Construct, m: OdmdEnverCdkDefaultEcrEks, props?: cdk.StackProps) {
        const revStr = m.targetRevision.type == 'b' ? m.targetRevision.value : m.targetRevision.toString();
        super(scope, OdmdEnverCdk.SANITIZE_STACK_NAME(`${m.owner.buildId}--${revStr}`), props);

        let cdk8App = new App();
        const chart = new Chart(cdk8App, 'theChart')

        this.implementConsumerRef(m.deployment)
        new Deployment(chart, 'deploy', m.deployment)

        if (m.ingress) {
            this.implementConsumerRef(m.ingress)
            new Ingress(chart, 'ingress', m.ingress)
        }
        if (m.service) {
            this.implementConsumerRef(m.service)
            new Service(chart, 'service', m.service)
        }

        new EksManifest(this, 'eks-manifest', {
            manifest: chart,
            enver: m,
            k8sNamespace: m.targetNamespace,
            targetEksCluster: m.targetEksCluster,
            skipValidate: true,
            pruneLabels: 'a=b',
            overWrite: true
        });

    }

    private implementConsumerRef(obj: any) {
        for (const prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                const val = obj[prop]
                if (typeof val == 'string' && val.startsWith(OdmdCrossRefConsumer.OdmdRef_prefix)) {
                    obj[prop] = OndemandContractsSandbox.inst.getRefConsumerFromOdmdRef(val).getSharedValue(this)
                    console.log(val + ' >> ' + obj[prop])
                } else if (typeof obj[prop] === 'object' && obj[prop] !== null) {
                    this.implementConsumerRef(obj[prop]);
                }
            }
        }
    }
}
