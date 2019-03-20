import sys
import json
import pandas
import numpy
import ordered_set
from sklearn import naive_bayes

"""
def scikitStuff(dataset_array):
#Pipeline imports
	from sklearn.pipeline import Pipeline

	from sklearn.feature_extraction.text import CountVectorizer
	from sklearn.feature_extraction.text import TfidfTransformer
	from sklearn.linear_model import SGDClassifier

#Classification and accuracy
	text_clf = Pipeline([('vect', CountVectorizer()), ('tfidf', TfidfTransformer()), ('clf', SGDClassifier(loss='hinge', penalty='l2', alpha=1e-3, n_iter=5, random_state=42)),])

	_ = text_clf.fit(dataset_array[0:79], dataset_array[80:99])
	predicted = text_clf.predict(dataset_array)
	print(np.mean(predicted == dataset_array.target))

"""
#Accesses data from the internet. Need to figure out how to import my own data.
#The returned dataset is a scikit-learn 'bunch':
# a simple holder object with fields that can be
 # both accessed as python dict keys or object attributes 

#Database fetching
	#categories = ['alt.atheism', 'soc.religion.christian','comp.graphics', 'sci.med']

	#from sklearn.datasets import fetch_20newsgroups
	#twenty_train = fetch_20newsgroups(subset='train',categories=categories, shuffle=True, random_state=42)

def testModel(inArray, outArray):
	from naive_bayes import MultinomialNB
	model = MultinomialNB()
	model.fit(inArray[0:94], outArray[0:94])
	print(model.score(inArray[94:99], outArray[94:99]))

#Given an array of json message data, returns an array with an orderedSet with the vocabulary, 
#followed by a dictionary with each word's counts
def buildVocabulary(messages):
	vocab = ordered_set.OrderedSet()
	vocabDict = {}
	for message in messages:
		#Loops through the list of elements created by splitting the subject and splitting the snippet
		messageText = message['subject'].split(' ')
		messageText.extend(message['snippet'].split(' '))
		for word in messageText:
			if word in vocab:
				vocabDict[word] = vocabDict[word] + 1
			else:
				vocab.add(word)
				vocabDict[word] = 1
	return [vocab, vocabDict]

#Given an array of json message data, gets word counts for that data 
def processMessages(messages, vocabArray):
	processedOutput = []

	for message in messages:
		processedMessage = {'read':None, 'features':None}
		if message['read'] == 'read':
			processedMessage['read'] = True
		else:
			processedMessage['read'] = False
		processedMessage['features'] = processText(message['subject'], message['snippet'], vocabArray)
		processedOutput.append(processedMessage)
	return processedOutput

#Given the subject and snippet, gets word count as a dict
def processText(subject, snippet, vocabArray):
	vocab = vocabArray[0]
	indexDict = {}
	messageText = subject.split(' ')
	messageText.extend(snippet.split(' '))
	for word in messageText:
		currentIndex = vocab.index(word)
		if currentIndex in indexDict:
			indexDict[currentIndex] = indexDict[currentIndex] + 1
		else:
			indexDict[currentIndex] = 1

	return indexDict

def createFeatureVectors(processedOutput, vocabLength):
	inVector = []
	outVector = []
	for message in processedOutput:
		featureArr = numpy.zeros(vocabLength)
		for k,v in message['features'].items():
			featureArr[k] = v
		outVector.append(message['read'])
		inVector.append(featureArr)
	return [inVector, outVector]


def main():
	f = open('workfile.txt', 'w', encoding='utf-8')
	stringThing = sys.argv[1]
	#.encode('utf8')
	f.write(stringThing)

	#Given the json string, returns a python dict
	jsonDic = json.loads(stringThing)
	messageArray = jsonDic['dataArray']

	vocabArray = buildVocabulary(messageArray)
	vocabLength = len(vocabArray[0])

	processedOutput = processMessages(messageArray, vocabArray)
	featureVectors = createFeatureVectors(processedOutput, vocabLength)

	inVector = featureVectors[0]
	outVector = featureVectors[1]

	testModel(inVector, outVector)

	#dataframe = pandas.read_json(stringThing)
	#dataset_array = dataframe.values
	
	#datasetString = numpy.array_repr(dataset_array)
	#dataSetBytes = datasetString.encode('utf-8', 'replace')
	#dataSetDecoded = dataSetBytes.decode('utf-8', 'replace')
	
	#dataset_array.dtype.type

	#scikitStuff(dataset_array)

if __name__ == "__main__":
	main()

