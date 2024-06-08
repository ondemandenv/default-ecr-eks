import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {
    ContractsCrossRefConsumer,
    ContractsEnverCdk,
    ContractsEnverCdkDefaultEcrEks,
    EksManifest
} from "@ondemandenv/odmd-contracts";
import * as cdk8splus from "cdk8s-plus-28";
import * as cdk8s from "cdk8s";


export class DefaultEcrEksStack extends cdk.Stack {

    constructor(scope: Construct, m: ContractsEnverCdkDefaultEcrEks, props?: cdk.StackProps) {
        const revStr = m.targetRevision.type == 'b' ? m.targetRevision.value : m.targetRevision.toString();
        super(scope, ContractsEnverCdk.SANITIZE_STACK_NAME(`${m.owner.buildId}--${revStr}`), props);

        const chart = new cdk8s.Chart(new cdk8s.App(), 'theChart')

        this.implementConsumerRef(m.deployment)

        new cdk8splus.Deployment(chart, 'deploy', m.deployment)


        if (m.ingress) {
            this.implementConsumerRef(m.ingress)
            new cdk8splus.Ingress(chart, 'ingress', m.ingress)
        }
        if (m.service) {
            this.implementConsumerRef(m.service)
            new cdk8splus.Service(chart, 'service', m.service)
        }

        if (m.job) {
            this.implementConsumerRef(m.job)
            new cdk8splus.Job(chart, 'job', m.job)
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
                if (typeof val == 'string') {
                    const bIdx = val.indexOf(ContractsCrossRefConsumer.OdmdRef_prefix)
                    if (bIdx >= 0) {
                        const eIdx = val.indexOf('}', bIdx + ContractsCrossRefConsumer.OdmdRef_prefix.length)
                        let s = val.substring(bIdx, eIdx + 1);
                        obj[prop] = val.substring(0, bIdx) + ContractsCrossRefConsumer.fromOdmdRef(s).getSharedValue(this) + val.substring(eIdx);
                        console.log(val + ' >> ' + obj[prop])
                    }
                } else if (typeof obj[prop] === 'object' && obj[prop] !== null) {
                    this.implementConsumerRef(obj[prop]);
                }
            }
        }
    }
}
