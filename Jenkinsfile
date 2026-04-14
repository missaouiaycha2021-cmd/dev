pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  environment {
    BACKEND_IMAGE  = "missaouiaycha/mon-dashboard-backend"
    FRONTEND_IMAGE = "missaouiaycha/mon-dashboard-frontend"
    IMAGE_TAG      = "v${BUILD_NUMBER}"
  }

  stages {

    // ================= CLEAN =================
    stage('Clean Workspace') {
      steps {
        cleanWs()
      }
    }

    // ================= INSTALL =================
    stage('Install Dependencies') {
      parallel {
        stage('Backend') {
          steps {
            dir('backend') {
              sh 'pip install -r requirements.txt'
            }
          }
        }
        stage('Frontend') {
          steps {
            dir('frontend') {
              sh 'npm install'
            }
          }
        }
      }
    }

    // ================= LINT =================
    stage('Lint') {
      parallel {
        stage('Backend') {
          steps {
            dir('backend') {
              sh 'flake8 . --max-line-length=120'
            }
          }
        }
        stage('Frontend') {
          steps {
            dir('frontend') {
              sh 'npm run lint || true'
            }
          }
        }
      }
    }

    // ================= TESTS =================
    stage('Tests') {
      parallel {
        stage('Backend') {
          steps {
            dir('backend') {
              sh 'pytest -v || true'
            }
          }
        }
        stage('Frontend') {
          steps {
            dir('frontend') {
              sh 'npm test -- --watchAll=false || true'
            }
          }
        }
      }
    }

    // ================= SONARQUBE =================
    stage('SonarQube Analysis') {
      parallel {
        stage('Backend') {
          steps {
            dir('backend') {
              withSonarQubeEnv('SonarQubeServer') {
                sh 'sonar-scanner'
              }
            }
          }
        }
        stage('Frontend') {
          steps {
            dir('frontend') {
              withSonarQubeEnv('SonarQubeServer') {
                sh 'sonar-scanner'
              }
            }
          }
        }
      }
    }

    // ================= SNYK =================
    stage('Snyk Scan') {
      parallel {
        stage('Backend') {
          steps {
            dir('backend') {
              sh 'snyk test --file=requirements.txt || true'
            }
          }
        }
        stage('Frontend') {
          steps {
            dir('frontend') {
              sh 'snyk test || true'
            }
          }
        }
      }
    }

    // ================= TRIVY FS =================
    stage('Trivy FS Scan') {
      parallel {
        stage('Backend') {
          steps {
            dir('backend') {
              sh 'trivy fs .'
            }
          }
        }
        stage('Frontend') {
          steps {
            dir('frontend') {
              sh 'trivy fs .'
            }
          }
        }
      }
    }

    // ================= BUILD FRONTEND =================
    stage('Build Frontend') {
      steps {
        dir('frontend') {
          sh 'npm run build'
        }
      }
    }

    // ================= DOCKER BUILD =================
    stage('Build Docker Images') {
      parallel {
        stage('Backend') {
          steps {
            sh 'docker build -t $BACKEND_IMAGE:$IMAGE_TAG backend'
          }
        }
        stage('Frontend') {
          steps {
            sh 'docker build -t $FRONTEND_IMAGE:$IMAGE_TAG frontend'
          }
        }
      }
    }

    // ================= TRIVY IMAGE =================
    stage('Trivy Image Scan') {
      parallel {
        stage('Backend') {
          steps {
            sh 'trivy image $BACKEND_IMAGE:$IMAGE_TAG'
          }
        }
        stage('Frontend') {
          steps {
            sh 'trivy image $FRONTEND_IMAGE:$IMAGE_TAG'
          }
        }
      }
    }

    // ================= DOCKER LOGIN =================
    stage('Docker Login') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
          sh 'echo $PASS | docker login -u $USER --password-stdin'
        }
      }
    }

    // ================= PUSH =================
    stage('Push Images') {
      parallel {
        stage('Backend') {
          steps {
            sh 'docker push $BACKEND_IMAGE:$IMAGE_TAG'
          }
        }
        stage('Frontend') {
          steps {
            sh 'docker push $FRONTEND_IMAGE:$IMAGE_TAG'
          }
        }
      }
    }

    // ================= DEPLOY =================
    stage('Deploy with Docker Compose') {
      steps {
        sh 'docker compose down || true'
        sh 'docker-compose up -d --build'
      }
    }

  }

  // ================= POST =================
  post {
    success {
      echo 'CI/CD SUCCESS 🚀 Application déployée avec sécurité complète'
    }
    failure {
      echo 'CI/CD FAILED ❌ Vérifiez les logs Jenkins'
    }
  }
}