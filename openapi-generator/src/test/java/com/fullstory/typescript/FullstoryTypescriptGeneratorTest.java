package com.fullstory.typescript;

import org.junit.Assert;
import org.junit.Test;
import org.openapitools.codegen.ClientOptInput;
import org.openapitools.codegen.DefaultGenerator;
import org.openapitools.codegen.config.CodegenConfigurator;

import java.util.*;

/***
 * This test allows you to easily launch your code generation software under a
 * debugger.
 * Then run this test under debug mode. You will be able to step through your
 * java code
 * and then see the results in the out directory.
 *
 * To experiment with debugging your code generator:
 * 1) Set a break point in FullstoryTypescriptGenerator.java in the
 * postProcessOperationsWithModels() method.
 * 2) To launch this test in Eclipse: right-click | Debug As | JUnit Test
 *
 */
public class FullstoryTypescriptGeneratorTest {
  // use this test to launch you code generator in the debugger.
  // this allows you to easily set break points in FullstoryTypescriptGenerator.
  @Test
  public void launchCodeGenerator() {
    Map<String, String> sm = new HashMap<>();
    sm.put("google.protobuf.NullValue", "null");

    final CodegenConfigurator configurator = new CodegenConfigurator()
        .setGeneratorName("fullstory-typescript")
        .setInputSpec("../users.swagger.json")
        .setOutputDir("out")
        .setSchemaMappings(sm);

    final ClientOptInput clientOptInput = configurator.toClientOptInput();
    DefaultGenerator generator = new DefaultGenerator();
    generator.opts(clientOptInput).generate();
  }

  @Test
  public void toTypescriptTypeNameTest() {
    FullstoryTypescriptGenerator codegen = new FullstoryTypescriptGenerator();
    String safePrefix = "safe";

    // take the third segment if starting with "fullstory.v2"
    String name = "fullstory.v2.users.UsersRequest";
    String tsName = codegen.toTypescriptTypeName(name, safePrefix);
    Assert.assertEquals("UsersRequest", tsName);

    // use default transformation if not starting with "fullstory.v2"
    name = "fullstory.v1.events.EventRequest";
    tsName = codegen.toTypescriptTypeName(name, safePrefix);
    Assert.assertEquals("FullstoryV1EventsEventRequest", tsName);

    // prefix when needed
    name = "Integer"; // reserved primitive for ts
    tsName = codegen.toTypescriptTypeName(name, safePrefix);
    Assert.assertEquals(safePrefix + "Integer", tsName);

    name = "fullstory.v2.users.Integer"; // also resolves to "Integer"
    tsName = codegen.toTypescriptTypeName(name, safePrefix);
    Assert.assertEquals(safePrefix + "Integer", tsName);

  }

  @Test
  public void modelDirTest() {
    FullstoryTypescriptGenerator codegen = new FullstoryTypescriptGenerator();

    String mp = "model";
    codegen.setModelPackage(mp);
    String packageResult = codegen.modelDir();
    Assert.assertEquals("model", packageResult);

    mp = "namespace.model";
    codegen.setModelPackage(mp);
    packageResult = codegen.modelDir();
    Assert.assertEquals("namespace/model", packageResult);
  }

  @Test
  public void modelFilenameTest() {
    FullstoryTypescriptGenerator codegen = new FullstoryTypescriptGenerator();
    codegen.processOpts();
    codegen.modelTemplateFiles();
    String templateName = "model.mustache";

    // put into sub folders base on resource name
    String modelName = "fullstory.v2.users.UserRequest";
    String filename = codegen.modelFilename(templateName, modelName);
    Assert.assertEquals("out/src/model/users/UserRequest.ts", filename);

    // use default logic if not fullstory models
    modelName = "third.party.SomeType";
    filename = codegen.modelFilename(templateName, modelName);
    Assert.assertEquals("out/src/model/ThirdPartySomeType.ts", filename);
  }
}