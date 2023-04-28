OPENAPI_GEN_VERSION := 6.4.0

build: setup-all gen-openapi
	npm run build:production

.PHONY: gen-openapi
gen-openapi: 
	mvn clean package -f ./openapi-generator -DskipTests

	# setup the custom generator and generate files
	java -cp \
	openapi-generator/target/fullstory-typescript-openapi-generator-1.0.0.jar:node_modules/@openapitools/openapi-generator-cli/versions/$(OPENAPI_GEN_VERSION).jar \
	org.openapitools.codegen.OpenAPIGenerator \
	batch --clean openapi-generator-configs/*.json

	# fix any lint errors for the generated comments and descriptions
	npm run lint:fix

.PHONY: setup-all
setup-all: 
	npm ci
	make setup-openapi

setup-openapi:
	npx @openapitools/openapi-generator-cli version-manager set $(OPENAPI_GEN_VERSION)
