const ARFF = require('node-arff');

//
// options:
//   skipTargetFilter = true: don't filter out target attributes from input attributes. I don't know why you'd want to do this.
//
function arffToInputs(arffData, targetAttributes, patternAttributes, options = {}) {  
  // set the target to the last attribute if no target attributes are given
  if (!targetAttributes || !Array.isArray(targetAttributes) || targetAttributes.length < 1) {
    targetAttributes = [arffData.attributes[arffData.attributes.length - 1]];
  }
  // get all the columns that represent the targets and place them in one place
  let targetColumns = targetAttributes.map((attribute) => {
    return arffData.data.map((dataRow) => {
      return dataRow[attribute];
    });
  });
  
  // set the patternAttributes to all
  if (!patternAttributes || !Array.isArray(patternAttributes) || patternAttributes.length < 1) {
    patternAttributes = arffData.attributes;
  }
  if (!options.skipTargetFilter) {
    // filter out the target attributes to get the input attributes
    patternAttributes = arffData.attributes.filter((attribute) => {
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
  
  trainTestData.filter((trainRow, index) => {
    if (index < Math.floor(validateSplit * arffData.data.length)) {
      validationData.data.push(dataRow);
      return false;
    }
    else {
      return true;
    }
  });
  
  return {
    trainArffData: trainTestData.trainData,
    validationArffData: validationData,
    testArffData: trainTestData.testData
  };
}

function loadArff(fileName, callback) {
  ARFF.load(fileName, (error, data) => {
    if (error) {
      throw new Error(error);
    }
    callback(data);
  });
  
  return 'THIS IS ASYNCHRONOUS';
}

module.exports = {
  arffToInputs: arffToInputs,
  splitArffTrainTest: splitArffTrainTest, 
  splitArffTrainValidateTest: splitArffTrainValidateTest
};