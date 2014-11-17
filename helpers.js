function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function replaceTables(data) {
  if (data.indexOf('[table') > -1) {
    var str = data.replace(/\n/g, '');
    var re = /(?:\[table.*?\])(.*?)(?:\[end table\])/g;
    str = str.replace(re, function(a, b, c, d) {
      var content = '<div class="inline-table"><table>';
      var headerFound = false;
      b = b.replace(/<(|\/)p>/g, ''); // kill paragraphs
      content += b.replace(/<ul>(.*?)<\/ul>/g, function(match, innerHTML) {
        if (!headerFound) {
          headerFound = true;
          return '<thead>' + innerHTML.replace(/li>/g, 'th>') + '</thead>';
        } else {
          return '<tr>' + innerHTML.replace(/li>/g, 'td>') + '</tr>';
        }
      });
      content += '</table></div>';
      return content;
    });
    return str;
  }
  return data;
}

function replaceGist(data) {
  return data.replace(/\[gist (.*?)\]/g, function(a, b) {
    return '<script src="https://gist.github.com/'+ b + '.js"></script>';
  });
}

var helpers = {
  serializer: require('./src/p2Serializer'),
  firstArticleInIssue: function(issue) {
    var articles = issue.getArticles();
    return articles.length? articles[0].getArticle() : false;
  },
  
  offsetArticleInIssue: function(issue, article, offset) {
    var searchID = article.id();
    var groups = issue.getArticles();
    var length = groups.length;
    for (var i = 0; i < length; i++) {
      var currentID = groups[i].getArticle().id();
      if ((currentID === searchID)) {
        if ((i + offset < length) && (i + offset >= 0)) {
          return groups[i + offset].getArticle();
        } else {
          return false;
        }
      }
    }
    return false;
  },

  nextArticleInIssue: function(issue, article) {
    return this.offsetArticleInIssue(issue, article, 1);
  },
  prevArticleInIssue: function(issue, article) {
    return this.offsetArticleInIssue(issue, article, -1);
  },
 
  articleURLParams: function(issue, article) {
    return {
      issueNum: (issue.getIssueNumber? issue.getIssueNumber(): issue.getNumber('issue.issue_number')),
      slug: (article.getSlug ? article.getSlug() : article.getText('article.slug'))
    };
  },
    
  /**
   * returns the first article from the articles with an id found in the list of linked documents
   *
   * note: if issues are able to link to more than just articles, this will need
   * to be changed to only search the issue.articles array
   **/
  articleInIssue: function(articles, issue) {
    var issueArticleIDs = issue.container.linkedDocuments.map(function(doc) {
      return doc.id;
    });
    for (var i = 0; i < articles.length; i++) {
      if (issueArticleIDs.indexOf(articles[i].id()) > -1) {
        return articles[i];
      }
    }

    throw "No article found in issue";
  },
  // Issue related
  issueLabel: function(issue) {
    return 'Issue ' + issue.getIssueNumber() + ', ' + issue.getIssueDate();
  },
  issueLabelShort: function(issue) {
    return 'Issue' + pad(issue.getIssueNumber(), 2) + ', ' + issue.getIssueDate();
  },
  issuePageNumber: function(issue, article) {
    var articles = issue.getArticles();
    var articleID = article.id();
    var articleIndex = null;
    for (var i = 0; i < articles.length; i++) {
      if (articleID === articles[i].getArticle().id()) {
        articleIndex = i + 1;
        break;
      }
    }
    return 'Page ' + articleIndex + ' / ' + articles.length;
  },

  offsetIssue: function(issues, currentIssue, offset) {
    var issueNumber = currentIssue.getIssueNumber();
    var offsetIssueNumber = issueNumber + offset;

    for (var i = 0; i < issues.length; i++) {
      var issue = issues[i];
      var issueNumber = issue.getIssueNumber? issue.getIssueNumber() : issue.getNumber('issue.issue_number');
      if (issueNumber == offsetIssueNumber) {
        return issues[i];
      }
    }

    return false;
  },

  prevIssue: function(issues, currentIssue) {
    return this.offsetIssue(issues, currentIssue, -1);
  },
  nextIssue: function(issues, currentIssue) {
    return this.offsetIssue(issues, currentIssue, 1);
  },

  // general
  sortDocumentsBy: function(documents, path) {
    documents = documents.sort(function(a, b) {
      return a.fragments[path].value - b.fragments[path].value;
    });

    return documents;
  },

  customRender: function(data) {
    data = replaceTables(data);
    data = replaceGist(data);

    return data;
  }
};

GLOBAL.helpers = helpers;
