package main

import (
	"context"
	"fmt"
	"log"

	"github.com/aws/aws-lambda-go/cfn"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/qldbsession"
	"github.com/awslabs/amazon-qldb-driver-go/qldbdriver"
)

func createTable(name string, txn qldbdriver.Transaction) error {
	log.Printf("Creating table %s", name)
	if _, err := txn.Execute(fmt.Sprintf("CREATE TABLE %s", name)); err != nil {
		return err
	}
	log.Printf("Table %s created", name)
	return nil
}

func createIndex(name string, table string, txn qldbdriver.Transaction) error {
	log.Printf("Creating index %s on table %s", name, table)
	if _, err := txn.Execute(fmt.Sprintf("CREATE INDEX ON %s (%s)", table, name)); err != nil {
		return err
	}
	log.Printf("Index %s created", name)
	return nil
}

func initQldb(qldbDriver qldbdriver.QLDBDriver) error {
	if _, err := qldbDriver.Execute(context.Background(), func(txn qldbdriver.Transaction) (interface{}, error) {
		if err := createTable("VehicleRegistration", txn); err != nil {
			return nil, err
		}

		if err := createTable("Vehicle", txn); err != nil {
			return nil, err
		}

		if err := createTable("Person", txn); err != nil {
			return nil, err
		}

		if err := createTable("DriversLicense", txn); err != nil {
			return nil, err
		}

		if err := createIndex("VIN", "VehicleRegistration", txn); err != nil {
			return nil, err
		}

		if err := createIndex("LicensePlateNumber", "VehicleRegistration", txn); err != nil {
			return nil, err
		}

		if err := createIndex("VIN", "Vehicle", txn); err != nil {
			return nil, err
		}

		if err := createIndex("GovId", "Person", txn); err != nil {
			return nil, err
		}

		if err := createIndex("LicenseNumber", "DriversLicense", txn); err != nil {
			return nil, err
		}

		if err := createIndex("PersonId", "DriversLicense", txn); err != nil {
			return nil, err
		}

		return nil, nil
	}); err != nil {
		return err

	}

	return nil
}

func handler(ctx context.Context, event cfn.Event) (physicalResourceID string, data map[string]interface{}, err error) {

	if event.RequestType == "Create" {
		ledgerName := event.ResourceProperties["LedgerName"].(string)

		awsSession := session.Must(session.NewSession())

		qldbSession := qldbsession.New(awsSession)

		qldbDriver, err := qldbdriver.New(
			ledgerName,
			qldbSession,
		)

		if err != nil {
			panic(err)
		}

		defer qldbDriver.Shutdown(context.Background())

		err = initQldb(*qldbDriver)

		if err != nil {
			panic(err)
		}
	}

	return
}

func main() {

	lambda.Start(cfn.LambdaWrap(handler))
}
