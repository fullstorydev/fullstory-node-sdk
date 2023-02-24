OPENAPI_GEN_VERSION := 6.4.0

gen-openapi:
	npx @openapitools/openapi-generator-cli version-manager set $(OPENAPI_GEN_VERSION)
	
	mvn clean package -f ./openapi-generator -DskipTests
    
	# setup the custom generator and generate files
	java -cp \
	openapi-generator/target/fullstory-typescript-openapi-generator-1.0.0.jar:node_modules/@openapitools/openapi-generator-cli/versions/$(OPENAPI_GEN_VERSION).jar \
	org.openapitools.codegen.OpenAPIGenerator \
	generate -c openapi-gen.config.json
