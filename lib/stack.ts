import * as cdk from '@aws-cdk/core';
import * as qldb from '@aws-cdk/aws-qldb';

import { CrForInitQldb } from './init-qldb'


export class Stack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: cdk.StackProps) {
        super(scope, id, props);

        const qldbLedger = new qldb.CfnLedger(this, 'VehicleRegistrationLedger', {
            name: 'vehicle-registration',
            permissionsMode: 'STANDARD',
        });

        const timeStampString = new Date().toISOString();

        const crForInitQldb = new CrForInitQldb(this, 'InitQldb', {
            ledgerName: qldbLedger.name!,
            description: `Generated by CDK on: ${timeStampString}`,
        });

        crForInitQldb.node.addDependency(qldbLedger)
    };
}
