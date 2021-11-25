import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as cr from "@aws-cdk/custom-resources";
import * as iam from "@aws-cdk/aws-iam";
import * as path from "path";

export interface CrForInitQldbProps {
  readonly ledgerName: string;
  readonly description: string;
}

export class CrForInitQldb extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: CrForInitQldbProps) {
    super(scope, id);

    const stack = cdk.Stack.of(this);
    const uid = "InitQldbProvider";
    const myProvider =
      (stack.node.tryFindChild(uid) as InitQldbProvider) ||
      new InitQldbProvider(stack, uid);

    new cdk.CustomResource(this, "Resoure", {
      resourceType: "Custom::CrForProvQldbTables",
      properties: {
        LedgerName: props.ledgerName,
      },
      serviceToken: myProvider.provider.serviceToken,
    });
  }
}

class InitQldbProvider extends cdk.Construct {
  public readonly provider: cr.Provider;

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    const lambdaExecutionRole = new iam.Role(this, "LambdaExecutionRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonQLDBFullAccess"),
      ],
    });

    const providerLambdaFn = new lambda.Function(this, "HandlerLambda", {
      handler: "main",
      runtime: lambda.Runtime.GO_1_X,
      code: lambda.Code.fromAsset(path.join(__dirname, "./lambda/initqdlb")),
      timeout: cdk.Duration.minutes(5),
      role: lambdaExecutionRole,
    });

    this.provider = new cr.Provider(this, "Provider", {
      onEventHandler: providerLambdaFn,
    });
  }
}
