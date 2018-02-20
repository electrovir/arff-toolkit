const ARFF = require('node-arff');

// this mutates arffData
function separateMultiClassArffData(arffData, outputAttributes) {  
  if (!Array.isArray(outputAttributes) || outputAttributes.length === 0) {
    outputAttributes = [arffData.attributes[arffData.attributes.length - 1]];
  }
  
  outputAttributes.forEach((attribute) => {
    if (arffData.types[attribute].hasOwnProperty('oneof') && arffData.types[attribute].oneof.length > 2) {
      
      arffData.attributes.splice(arffData.attributes.indexOf(attribute), 1);
      outputAttributes.splice(arffData.attributes.indexOf(attribute), 1);
      
      arffData.types[attribute].oneof.forEach((oneofValue, oneofIndex) => {
        const newAttributeName = attribute + '__' + oneofValue;
        
        outputAttributes.push(newAttributeName);
        arffData.attributes.push(newAttributeName);
        
        arffData.types[newAttributeName] = {type: 'nominal', oneof: ['n', 'y']};
        
        arffData.data.forEach((entry) => {
          if (entry[attribute] == oneofIndex) {
            entry[newAttributeName] = 1;
          }
          else {
            entry[newAttributeName] = 0;
          }
        });
        
      });
      
    }
  });
  return outputAttributes;
}

//
// options:
//   skipTargetFilter = true: don't filter out target attributes from input attributes. I don't know why you'd want to do this.
//
function arffToInputs(arffData, targetAttributes, patternAttributes, options = {}) {
  // set the target to the last attribute if no target attributes are given
  if (!Array.isArray(targetAttributes) || targetAttributes.length === 0) {
    targetAttributes = [arffData.attributes[arffData.attributes.length - 1]];
  }
  // get all the columns that represent the targets and place them in one place
  let targetColumns = targetAttributes.map((attribute) => {
    return arffData.data.map((dataRow) => {
      return dataRow[attribute];
    });
  });
  
  // set the patternAttributes to all
  if (!Array.isArray(patternAttributes) || patternAttributes.length === 0) {
    patternAttributes = arffData.attributes;
  }
  if (!options.skipTargetFilter) {
    // filter out the target attributes to get the input attributes
    patternAttributes = patternAttributes.filter((attribute) => {
      return targetAttributes.indexOf(attribute) === -1;
    });
  }
  
  // grab all the input attributes out of each data row to form the set of inputs/patterns
  let patterns = arffData.data.map((dataRow) => {
    return patternAttributes.map((attribute) => {
      return dataRow[attribute];
    });
  });
  
  return {
    targetColumns: targetColumns,
    patterns: patterns,
    patternAttributes: patternAttributes,
    targetAttributes: targetAttributes
  };
}

//
// options:
//   dontShuffle = true: don't randomize the data before splitting it. Bad idea for final training.
//
function splitArffTrainTest(arffData, trainSplit, options = {}) {
  if (!options.dontShuffle) {
    arffData.randomize();
  }
  
  let trainData = Object.assign({}, arffData, {data: []});
  let testData  = Object.assign({}, arffData, {data: []});
  
  arffData.data.forEach((dataRow, index) => {
    if (index < Math.floor(trainSplit * arffData.data.length)) {
      trainData.data.push(dataRow);
    }
    else {
      testData.data.push(dataRow);
    }
  });
  
  return {
    trainArffData: trainData,
    testArffData: testData
  };
}

//
// options:
//   dontShuffle = true: don't randomize the data before splitting it. Bad idea for final training.
//
// validateSplit is the percent of the training set that is set aside for validation.
function splitArffTrainValidateTest(arffData, trainSplit, validateSplit, options = {}) {
  let trainTestData = splitArffTrainTest(arffData, trainSplit, options);
  
  let validationData  = Object.assign({}, arffData, {data: []});
  
  trainTestData.testArffData.data = trainTestData.testArffData.data.filter((trainRow, index) => {
    if (index < Math.floor(validateSplit * arffData.data.length)) {
      validationData.data.push(trainRow);
      return false;
    }
    else {
      return true;
    }
  });
  
  return {
    trainArffData: trainTestData.trainArffData,
    validationArffData: validationData,
    testArffData: trainTestData.testArffData
  };
}

// just a wrapper to make it easier to read ARFF files
function loadArff(fileName, callback) {
  ARFF.load(fileName, (error, data) => {
    if (error) {
      throw new Error(filename + error);
    }
    callback(data);
  });
  
  return 'THIS IS ASYNCHRONOUS';
}

module.exports = {
  loadArff: loadArff,
  arffToInputs: arffToInputs,
  splitArffTrainTest: splitArffTrainTest, 
  splitArffTrainValidateTest: splitArffTrainValidateTest,
  separateMultiClassArffData: separateMultiClassArffData
};