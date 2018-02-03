const ARFF = require('node-arff');
const PERCEPTRON = require('./perceptron.js');

// 
// PRIVATE FUNCTIONS
// 

function arffToInputs(arffData, targetAttributes) {  
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
  
  // filter out the target attributes to get the input attributes
  const inputAttributes = arffData.attributes.filter((attribute) => {
    return targetAttributes.indexOf(attribute) === -1;
  });
  
  // grab all the input attributes out of each data row to form the set of inputs/patterns
  let inputs = arffData.data.map((dataRow) => {
    return inputAttributes.map((attribute) => {
      return dataRow[attribute];
    });
  });
  
  
  return {
    targetColumns: targetColumns,
    patterns: inputs,
    inputAttributes: inputAttributes,
    targetAttributes: targetAttributes
  };
}

function defaultWeights(targetCount, inputCount, defaultWeight = 0) {
  let weights = [];
  
  for (let i = 0; i < targetCount; i++) {
    let weightRow = [];
    
    for (let j = 0; j < inputCount; j++) {
      weightRow.push(0);
    }
    weights.push(weightRow);
  }
  
  return weights;
}

function trainPerceptronOnArffData(arffInputs, shuffle, learningRate, initWeightsSet) {
  const startTime = Number(new Date());
  
  const targetColumns = arffInputs.targetColumns;
  const patterns = arffInputs.patterns;
  
  let trainResults = targetColumns.map((targets, targetIndex) => {
    return PERCEPTRON.train(initWeightsSet[targetIndex], patterns, targets, learningRate, shuffle);
  });
  
  return {
    time: Number(new Date()) - startTime,
    results: trainResults
  };
}

function runPerceptronOnArffData(arffInputs, weightsSet, threshold) {
  return weightsSet.map((weights) => {
    return PERCEPTRON.run(weights, arffInputs.patterns, threshold);
  });
}

function testPerceptronOnArffData(arffInputs, weightsSet, threshold) {
  return weightsSet.map((weights, index) => {
    return PERCEPTRON.test(weights, arffInputs.patterns, arffInputs.targetColumns[index]);
  });
}

function setupPerceptronTrainingOptions(arffData, options) {
  if (!options) {
    options = {};
  }
  
  let initWeightsSet = options.initWeightsSet;
  const shuffle = options.shuffle || false;
  const learningRate = options.learningRate || 0.1;

  if (!Array.isArray(initWeightsSet) || initWeightsSet.length < 1) {
    initWeightsSet = defaultWeights(arffData.targetColumns.length, arffData.patterns[0].length);
  }
  
  return [
    shuffle,
    learningRate,
    initWeightsSet
  ];
}

// 
// PUBLIC FUNCTIONS
// 

function splitArffData(arffData, trainSplit) {
  
  arffData.randomize();
  
  trainData = Object.assign({}, arffData, {data: []});
  testData  = Object.assign({}, arffData, {data: []});
  
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

// NOTE: ASYNCHRONOUS!!
function loadArff(fileName, callback) {
  ARFF.load(fileName, (error, data) => {
    if (error) {
      throw new Error(error);
    }
    callback(data);
  });
}

function trainOnArff(fileName, callback, options = {}) {
  loadArff(fileName, (arffData) => {
    const arffInputs = arffToInputs(arffData);
    callback(
      trainPerceptronOnArffData(
        arffInputs,
        ...setupPerceptronTrainingOptions(arffInputs, options)
      )
    );
  });
  
  return 'THIS IS ASYNCHRONOUS';
}

function runOnArff(fileName, weightsSet, callback, options = {}) {
  loadArff(fileName, (arffData) => {
    callback(
      runPerceptronOnArffData(
        arffToInputs(arffData),
        weightsSet,
        options.threshold
      )
    );
  });
  
  return 'THIS IS ASYNCHRONOUS';
}

function testOnArff(fileName, weightsSet, callback, options = {}) {
  loadArff(fileName, (arffData) => {
    callback(
      testPerceptronOnArffData(
        arffToInputs(arffData),
        weightsSet,
        options.threshold
      )
    );
  });
  
  return 'THIS IS ASYNCHRONOUS';
}

function trainTestOnArff(fileName, trainSplit, callback, options = {}) {
  loadArff(fileName, (arffData) => {
    
    const arffSplitData = splitArffData(arffData, trainSplit);
    const arffTrainInputs = arffToInputs(arffSplitData.trainArffData, options.targetAttributes);
    const arffTestInputs = arffToInputs(arffSplitData.testArffData, options.targetAttributes);
    
    const trainResults = trainPerceptronOnArffData(
      arffTrainInputs,
      ...setupPerceptronTrainingOptions(arffTrainInputs, options)
    );
    
    const weightsSet = trainResults.results.map((result) => {
      return result.finalWeights;
    });
    
    const testResults = testPerceptronOnArffData(
        arffTestInputs,
        weightsSet,
        options.threshold
      );
    
    callback({
      training: trainResults,
      testing: testResults
    });
  });
  
  return 'THIS IS ASYNCHRONOUS';
}

module.exports = {
  train: trainOnArff,
  run: runOnArff,
  test: testOnArff,
  trainTest: trainTestOnArff,
  load: loadArff,
  split: splitArffData
};