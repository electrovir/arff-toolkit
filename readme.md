# ARFF Toolkit

This package is a WIP for a machine learning class.

This isn't really intended for public use yet (if it ever reaches that point), hence the version number < 1.

## Terminology

  * patterns: input set, all input rows, entire input matrix.
  * pattern: a single combination of inputs, a row in the patterns matrix.
  * targets: labels, the desired outcomes. Ordering must match the patterns matrix.

## Usage

```Javascript
const ARFF = require('arff-toolkit');
```

### loadArff

```JavaScript

// load the given arff file.
ARFF.loadArff(filePath, function callback(result) {
  // use result here
});
```

  * **result**: the data passed to the callback function is the parsed arff file data from the ``node-arff`` package.

#### return value

None. Asynchronous function.

### arffToInputs

```Javascript
ARFF.arffToInputs(arffData, targetAttributes, patternAttributes, options);
```

  * **arffData**: The data from am arff file in the format as retrieved from ``ARFF.loadArff``.
  * **targetAttributes**: Array of strings of the feature names that are to be treated as targets for the algorithm. *Defaults* to the last feature.
  * **patternAttributes**: Array of strings of the feature names that are to be used as pattern inputs to the algorithm. All target features will automatically be removed from this list unless set otherwise in *options*. *Defaults* to all the features excluding the last one.
  * **options**: possible options for altering this functions behavior. This should be an object with the possible properties:
      * **options.skipTargetFilter**: boolean value, *defaults* to ``false``. If set to true, the target features will not be removed from the pattern attributes list. (This is *not* common.)
      * Example: ``{skipTargetFilter: true}``

#### return value

```JSON
{
  targetColumns: targetColumns,
  patterns: patterns,
  patternAttributes: patternAttributes,
  targetAttributes: targetAttributes
}
```

  * **targetColumns**: Matrix of values for the target columns. Each row is a different target feature, each cell is the target value. The order of the targets matches the patterns matrix.<br> ``targetColumns[target_feature_index][pattern_index]``
  * **patterns**: Matrix of values for the pattern inputs. Each row is a different feature, each cell is a different  pattern value. The subcells are the pattern's input values.<br> ``patterns[feature_index][pattern_index][input_index]``
  * **patternAttributes**: List of feature names that are treated as pattern inputs.
  * **targetAttributes**: List of feature names that are treated as targets.

