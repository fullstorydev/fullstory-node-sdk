package com.fullstory.typescript;

import org.openapitools.codegen.*;
import org.openapitools.codegen.model.*;
import org.openapitools.codegen.languages.AbstractTypeScriptClientCodegen;

import java.util.*;
import java.io.File;

public class FullstoryTypescriptGenerator extends AbstractTypeScriptClientCodegen {

  // source folder where to write the files
  protected String sourceFolder = "src";
  protected String fsPrefix = "fullstory.v2";

  /**
   * Configures the type of generator.
   *
   * @return the CodegenType for this generator
   * @see org.openapitools.codegen.CodegenType
   */
  public CodegenType getTag() {
    return CodegenType.CLIENT;
  }

  /**
   * Configures a friendly name for the generator. This will be used by the
   * generator
   * to select the library with the -g flag.
   *
   * @return the friendly name for the generator
   */
  public String getName() {
    return "fullstory-typescript";
  }

  /**
   * Returns human-friendly help for the generator. Provide the consumer with help
   * tips, parameters here
   *
   * @return A string value for the help message
   */
  public String getHelp() {
    // TODO(sabrina)
    return "Generates a fullstory-typescript client library.";
  }

  public FullstoryTypescriptGenerator() {
    super();

    outputFolder = "out";
    templateDir = "fullstory-typescript";
    apiPackage = "api";
    modelPackage = "model";
  }

  @Override
  public void processOpts() {
    super.processOpts();

    modelTemplateFiles.put("model.mustache", ".ts");
    supportingFiles
        .add(new SupportingFile("model-index.mustache",
            sourceFolder + File.separator + modelPackage().replace('.', File.separatorChar), "index.ts"));
  }

  /**
   * Override toTypescriptTypeName to strip off the fullstory fqn prefixes, before
   * calling the super method.
   * This takes the last segment of the named schema, if starting with the
   * fullstory prefix, as the Type's Name.
   **/
  @Override
  protected String toTypescriptTypeName(String name, String safePrefix) {
    if (name != null && name.startsWith(fsPrefix)) {
      String[] segments = name.split("\\.");
      if (segments.length > 2) {
        name = segments[segments.length - 1];
      }
    }

    return super.toTypescriptTypeName(name, safePrefix);
  }

  /**
   * Root location to write all model files.
   */
  @Override
  public String modelFileFolder() {
    String folder = "";
    if (outputFolder != "") {
      folder += outputFolder + File.separator;
    }
    if (sourceFolder != "") {
      folder += sourceFolder + File.separator;
    }
    folder += modelPackage.replace('.', File.separatorChar);
    return folder;
  }

  /**
   * Subfolder inside modelFileFolder() to write model files.
   */
  private String toModelFolderName(String name) {
    if (name != null && name.startsWith(fsPrefix)) {
      String[] segments = name.split("\\.");
      if (segments.length > 2) {
        name = segments[2];
      }
    }
    return name;
  }

  @Override
  public String modelFilename(String templateName, String modelName) {
    String suffix = modelTemplateFiles().get(templateName);
    String filename = modelFileFolder() + File.separator + toModelFolderName(modelName) + File.separator
        + toModelFilename(modelName) + suffix;
    return filename;
  }

  /**
   * Post-processing for all models to with TS specific fields.
   */
  @Override
  public Map<String, ModelsMap> postProcessAllModels(Map<String, ModelsMap> objs) {
    Map<String, ModelsMap> models = super.postProcessAllModels(objs);

    // first loop over all models map and create import map for all models
    Map<String, String> importLocMap = overrideAllImportsPathsInModels(models);

    // loop over all models to add "tsImport" to each model
    addTsImportsToModels(models, importLocMap);

    return models;
  }

  private Map<String, String> overrideAllImportsPathsInModels(Map<String, ModelsMap> models) {
    Map<String, String> importLocMap = new HashMap<>();
    for (String modelName : models.keySet()) {
      ModelsMap entry = models.get(modelName);
      for (ModelMap mo : entry.getModels()) {
        String className = mo.getModel().getClassname();
        // TODO(sabrina): handle possible duplicate classnames from different path?
        String tsImportRelPath = toModelFolderName(modelName) + "/" + className;

        mo.put("importPath", tsImportRelPath);
        importLocMap.put(className, tsImportRelPath);
      }
    }
    return importLocMap;
  }

  private void addTsImportsToModels(Map<String, ModelsMap> models, Map<String, String> importLocMap) {
    for (String modelName : models.keySet()) {

      ModelsMap entry = models.get(modelName);
      for (ModelMap mo : entry.getModels()) {

        CodegenModel cm = mo.getModel();
        List<Map<String, String>> tsImports = new ArrayList<>();

        for (String im : cm.imports) {
          HashMap<String, String> tsImport = new HashMap<>();
          tsImport.put("classname", im);
          tsImport.put("filename", importLocMap.get(im));
          tsImports.add(tsImport);
        }

        mo.put("tsImports", tsImports);
      }

    }
  }
}
