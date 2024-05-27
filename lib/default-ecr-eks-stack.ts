import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {
    ContractsCrossRefConsumer, ContractsEnverCdk, OndemandContracts,
    AnyContractsEnVer, ContractsEnverCdkDefaultEcrEks, EksManifest
} from "@ondemandenv/odmd-contracts";
import {Deployment, Ingress, Service} from "cdk8s-plus-28";
import {App, Chart} from "cdk8s";


export class DefaultEcrEksStack extends cdk.Stack {

    constructor(scope: Construct, m: ContractsEnverCdkDefaultEcrEks, props?: cdk.StackProps) {
        const revStr = m.targetRevision.type == 'b' ? m.targetRevision.value : m.targetRevision.toString();
        super(scope, ContractsEnverCdk.SANITIZE_STACK_NAME(`${m.owner.buildId}--${revStr}`), props);

        let csm: ContractsCrossRefConsumer<AnyContractsEnVer, AnyContractsEnVer>
        for (const e of OndemandContracts.inst.odmdBuilds) {
            const aa = e.node.findAll().find(n => m.k8s.deployment.containers![0].image.endsWith(n.node.path))
            console.log(aa)
            if (aa) {
                csm = aa as ContractsCrossRefConsumer<AnyContractsEnVer, AnyContractsEnVer>
                break;
            }
        }

        const chart = new Chart(new App(), 'tmp')

        new Deployment(chart, 'deploy', m.k8s.deployment)

        if (m.k8s.ingress) {
            new Ingress(chart, 'ingress', m.k8s.ingress)
        }
        if (m.k8s.service) {
            new Service(chart, 'service', m.k8s.service)
        }


        new EksManifest(this, 'd-i-s', {
            manifest: chart,
            enver: m,
            k8sNamespace: m.k8s.targetNamespace,
            targetEksCluster: m.k8s.targetEksCluster
        });

    }
}
