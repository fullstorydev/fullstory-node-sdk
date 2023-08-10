package com.fullstory.typescript;

import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.tags.Tag;

import org.openapitools.codegen.*;
import org.openapitools.codegen.model.*;
import org.openapitools.codegen.utils.CamelizeOption;
import org.openapitools.codegen.languages.AbstractTypeScriptClientCodegen;

import java.util.*;
import java.util.function.Predicate;
import java.util.stream.Collectors;
import java.io.File;

import static org.openapitools.codegen.utils.StringUtils.camelize;

public class FullstoryTypescriptGenerator extends AbstractTypeScriptClientCodegen {
  // the server API resource name
  public static final String RESOURCE_NAME = "resourceName";
  // should skip any prefixes, useful when there's no need to generate beta paths
  public static final String SKIP_OPERATIONS = "skipOperations";

  // source folder where to write the files, relative to root
  protected String sourceFolder = "src";
  protected String fsPrefix = "fullstory.v2";
  protected String resourceName = "";
  protected Map<String, List<String>> skipGenerateOperation = new HashMap<>();

  private static final String DESCRIPTION_OVERRIDE_KEY = "x-fullstory-sdk-description-override";

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

    this.cliOptions.add(new CliOption(RESOURCE_NAME,
        "The resource name for the FullStory server API."));
    this.cliOptions.add(new CliOption(SKIP_OPERATIONS,
        "Skip generating any operations with provided method + path prefix, provide comma separated key value pairs, if more than one operation needs to be provided.\n Format: {POST=[/path/prefix/to/ignore],*=[/ignore/all/methods]}"));
  }

  @Override
  public void processOpts() {
    super.processOpts();

    modelTemplateFiles.put("model-single.mustache", ".ts");
    apiTemplateFiles.put("api-single.mustache", ".ts");

    if (additionalProperties.containsKey(RESOURCE_NAME)) {
      this.resourceName = String.valueOf(additionalProperties.get(RESOURCE_NAME)) + ".";
    }

    if (additionalProperties.containsKey(SKIP_OPERATIONS)) {
      Object skips = additionalProperties.get(SKIP_OPERATIONS);

      try {
        this.skipGenerateOperation = (Map<String, List<String>>) skips;
      } catch (ClassCastException e) {
        throw new RuntimeException("Unable to parse skipOperations, please make sure the value provided is valid.", e);
      }
    }

    supportingFiles
        .add(new SupportingFile("model-index.mustache",
            getSourceFolder() + File.separator + modelDir(),
            this.resourceName + "index.ts"));
    supportingFiles
        .add(new SupportingFile("api-index.mustache",
            getSourceFolder() + File.separator + apiDir(),
            this.resourceName + "index.ts"));
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

  protected String modelDir() {
    return modelPackage().replace('.', File.separatorChar);
  }

  protected String apiDir() {
    return apiPackage().replace('.', File.separatorChar);
  }

  protected String getSourceFolder() {
    return sourceFolder;
  }

  /**
   * Root location to for source folder.
   * Source folder contains both api and model folders.
   * 
   * @return absolute path to the source folder.
   */
  protected String getAbsoluteSourceFolder() {
    String folder = "";
    if (!"".equals(getOutputDir())) {
      folder += getOutputDir() + File.separator;
    }
    if (!"".equals(getSourceFolder())) {
      folder += getSourceFolder();
    }
    return folder;
  }

  /**
   * Root location to write all model files.
   */
  @Override
  public String modelFileFolder() {
    return getAbsoluteSourceFolder() + File.separator + modelDir();
  }

  /**
   * Root location to write all API files.
   */
  @Override
  public String apiFileFolder() {
    return getAbsoluteSourceFolder() + File.separator + apiDir();
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
    } else {
      // if not starting with fsPrefix, then don't put in any subfolder.
      name = "";
    }
    return camelize(name, CamelizeOption.LOWERCASE_FIRST_LETTER);
  }

  @Override
  public String modelFilename(String templateName, String modelName) {
    String suffix = modelTemplateFiles().get(templateName);
    String filename = (!"".equals(modelFileFolder()) ? modelFileFolder() + File.separator : "")
        + (!"".equals(toModelFolderName(modelName)) ? toModelFolderName(modelName) + File.separator : "")
        + toModelFilename(modelName) + suffix;
    return filename;
  }

  /**
   * Subfolder inside apiFileFolder() to write api files.
   */
  private String toApiFolderName(String tag) {
    String[] segments = tag.split("\\.");
    if (segments.length > 0) {
      tag = segments[0];
    }
    return camelize(tag, CamelizeOption.LOWERCASE_FIRST_LETTER);
  }

  @Override
  public String apiFilename(String templateName, String tag) {
    String suffix = apiTemplateFiles().get(templateName);
    String filename = (!"".equals(apiFileFolder()) ? apiFileFolder() + File.separator : "")
        + (!"".equals(toApiFolderName(tag)) ? toApiFolderName(tag) + File.separator : "")
        + toApiFilename(tag) + suffix;
    return filename;
  }

  /**
   * Post-processing for all models to with TS specific fields.
   */
  @Override
  public Map<String, ModelsMap> postProcessAllModels(Map<String, ModelsMap> objs) {
    Map<String, ModelsMap> models = super.postProcessAllModels(objs);

    // loop over all models to check for vender extensions for description override,
    // if the model contains a fullstory vendor extension
    overrideDescription(objs);

    // first loop over all models map and create import map for all models
    Map<String, String> importLocMap = overrideAllImportsPathsInModels(models);

    // loop over all models to add "tsImport" to each model
    // TODO(sarbina): maybe use toModelImport?
    addTsImportsToModels(models, importLocMap);

    return models;
  }

  /**
   * Post-processing for all api operations to with TS specific fields.
   */
  @Override
  public OperationsMap postProcessOperationsWithModels(OperationsMap operations, List<ModelMap> allModels) {
    OperationMap operationMap = operations.getOperations();

    // put ts imports, for now, api files only imports form @model
    Map<String, String> importPathMap = new HashMap<>();
    for (ModelMap mo : allModels) {
      String importPath = setImportPathForModel(mo.getModel().getName(), mo);
      importPathMap.put(mo.getModel().getClassname(), importPath);
    }
    Map<String, String> tsImports = new HashMap<>();
    for (CodegenOperation op : operationMap.getOperation()) {
      for (String im : op.imports) {
        tsImports.put(im, importPathMap.get(im));
      }
      // should always have a named return type, unless api does not return anything.
      // i.e. DELETE requests
      if (op.returnType == "object") {
        op.returnType = null;
      }

      // the operation's notes and all it's parameters descriptions
      // if the model contains a fullstory vendor extension
      overrideDescription(op);
    }

    operations.put("tsImports", tsImports);
    // TODO(sarbina): maybe use toApiImport?
    operationMap.put("importPath", toApiFolderName(operationMap.getPathPrefix()));

    if (this.skipGenerateOperation.size() == 0) {
      return operations;
    }

    Set<Map.Entry<String, List<String>>> skipGenerateOperationEntries = this.skipGenerateOperation.entrySet();
    this.filterOperations(operations, op -> {
      for (Map.Entry<String, List<String>> entry : skipGenerateOperationEntries) {
        // method match or wild card for all methods
        if (entry.getKey() == "*" || entry.getKey() == op.httpMethod) {
          for (String prefix : entry.getValue()) {
            if (op.path.startsWith(prefix)) {
              return true;
            }
          }
        }
      }
      return false;
    });

    return operations;

  }

  // mutate the operations to filter any unwanted operations
  void filterOperations(OperationsMap operations, Predicate<CodegenOperation> shouldSkip) {

    List<CodegenOperation> codeGenOps = operations.getOperations().getOperation();

    for (int i = 0; i < codeGenOps.size(); i++) {
      CodegenOperation o = codeGenOps.get(i);
      if (shouldSkip.test(o)) {
        codeGenOps.remove(i);
      }

    }
  }

  @Override
  public void addOperationToGroup(
      String tag,
      String resourcePath,
      Operation operation,
      CodegenOperation co,
      Map<String, List<CodegenOperation>> operations) {
    if (co.tags.size() == 0) {
      super.addOperationToGroup(tag, resourcePath, operation, co, operations);
      return;
    } else if (!tag.equals(co.tags.get(0).getName())) {
      // Operations are added to OperationsMap based on tags. If more than one tag is
      // added for an operation, there will be duplicates in the group. Remove any
      // duplicate operations and only process it once when seeing the first tag.
      return;
    }

    super.addOperationToGroup(sanitizeAndJoinTags(".", co.tags), resourcePath, operation, co, operations);
  }

  private String sanitizeAndJoinTags(String separator, List<Tag> tags) {
    List<String> cleanTagNames = tags.stream().map(t -> sanitizeTag(t.getName())).collect(Collectors.toList());
    return String.join(separator, cleanTagNames);
  }

  private Map<String, String> overrideAllImportsPathsInModels(Map<String, ModelsMap> models) {
    Map<String, String> importLocMap = new HashMap<>();
    for (String modelName : models.keySet()) {
      ModelsMap entry = models.get(modelName);
      for (ModelMap mo : entry.getModels()) {

        String className = mo.getModel().getClassname();
        String tsImportRelPath = setImportPathForModel(modelName, mo);
        importLocMap.put(className, tsImportRelPath);
      }
    }
    return importLocMap;
  }

  private String setImportPathForModel(String modelName, ModelMap mo) {
    String className = mo.getModel().getClassname();
    // TODO(sabrina): handle possible duplicate classnames from different path?
    String tsImportRelPath = toModelFolderName(modelName) + "/" + className;

    mo.put("importPath", tsImportRelPath);
    return tsImportRelPath;
  }

  private void addTsImportsToModels(Map<String, ModelsMap> models, Map<String, String> importLocMap) {
    for (String modelName : models.keySet()) {
      ModelsMap entry = models.get(modelName);
      for (ModelMap mo : entry.getModels()) {
        addTsImportsToModel(mo, importLocMap);
      }
    }
  }

  private void addTsImportsToModel(ModelMap mo, Map<String, String> importLocMap) {
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

  private void overrideDescription(CodegenOperation op) {
    if (!op.getHasVendorExtensions()) {
      return;
    }
    Object descObj = op.vendorExtensions.get(DESCRIPTION_OVERRIDE_KEY);
    if (descObj == null) {
      return;
    }
    op.unescapedNotes = String.valueOf(op.vendorExtensions.get(DESCRIPTION_OVERRIDE_KEY));
    op.notes = escapeText(op.unescapedNotes);

    for (CodegenParameter param : op.allParams) {
      overrideDescription(param);
    }
  }

  private void overrideDescription(CodegenParameter p) {
    if (p.vendorExtensions == null) {
      return;
    }
    Object descObj = p.vendorExtensions.get(DESCRIPTION_OVERRIDE_KEY);
    if (descObj == null) {
      return;
    }
    p.unescapedDescription = String.valueOf(p.vendorExtensions.get(DESCRIPTION_OVERRIDE_KEY));
    p.description = escapeText(p.unescapedDescription);
  }

  private void overrideDescription(CodegenModel m) {
    if (m.getVendorExtensions() == null) {
      return;
    }
    Object descObj = m.getVendorExtensions().get(DESCRIPTION_OVERRIDE_KEY);
    if (descObj == null) {
      return;
    }
    m.unescapedDescription = String.valueOf(descObj);
    m.description = escapeText(m.unescapedDescription);
  }

  private void overrideDescription(Map<String, ModelsMap> models) {
    for (String modelName : models.keySet()) {
      ModelsMap entry = models.get(modelName);
      for (ModelMap mo : entry.getModels()) {
        CodegenModel m = mo.getModel();
        overrideDescription(m);
      }
    }
  }
}
