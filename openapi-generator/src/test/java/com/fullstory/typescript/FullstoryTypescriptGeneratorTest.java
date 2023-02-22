package com.fullstory.typescript;

import org.junit.Test;
import org.openapitools.codegen.ClientOptInput;
import org.openapitools.codegen.DefaultGenerator;
import org.openapitools.codegen.config.CodegenConfigurator;

import java.util.*;

/***
 * This test allows you to easily launch your code generation software under a debugger.
 * Then run this test under debug mode.  You will be able to step through your java code
 * and then see the results in the out directory.
 *
 * To experiment with debugging your code generator:
 * 1) Set a break point in FullstoryTypescriptGenerator.java in the postProcessOperationsWithModels() method.
 * 2) To launch this test in Eclipse: right-click | Debug As | JUnit Test
 *
 */
public class FullstoryTypescriptGeneratorTest {
  // use this test to launch you code generator in the debugger.
  // this allows you to easily set break points in FullstoryTypescriptGenerator.
  @Test
  public void launchCodeGenerator() {
    Map<String, String> globalProps = new HashMap<>();
    globalProps.put("models","*");
    final CodegenConfigurator configurator = new CodegenConfigurator()
              .setGeneratorName("fullstory-typescript")
              .setGlobalProperties(globalProps)
              .setInputSpec("all.swagger.json")
              .setOutputDir("out");

    final ClientOptInput clientOptInput = configurator.toClientOptInput();
    DefaultGenerator generator = new DefaultGenerator();
    generator.opts(clientOptInput).generate();
  }
}