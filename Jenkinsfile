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

    // ================= CHECKOUT =================
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    // ================= DEBUG =================
    stage('Debug Workspace') {
      steps {
        sh 'echo "=== WORKSPACE CONTENT ==="'
        sh 'pwd'
        sh 'ls -R'
      }
    }

    // ================= CLEAN (optionnel) =================
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
              sh 'ls -la'
              sh 'pip install -r requirements.txt'
            }
          }
        }

        stage('Frontend') {
          steps {
            dir('frontend') {
              sh 'ls -la'
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
              sh 'flake8 . || true'
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

    // ================= SONAR =================
    stage('SonarQube Analysis') {
      parallel {
        stage('Backend') {
          steps {
            dir('backend') {
              withSonarQubeEnv('SonarQubeServer') {
                sh 'sonar-scanner || true'
              }
            }
          }
        }

        stage('Frontend') {
          steps {
            dir('frontend') {
              withSonarQubeEnv('SonarQubeServer') {
                sh 'sonar-scanner || true'
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
              sh 'trivy fs . || true'
            }
          }
        }

        stage('Frontend') {
          steps {
            dir('frontend') {
              sh 'trivy fs . || true'
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
            sh 'trivy image $BACKEND_IMAGE:$IMAGE_TAG || true'
          }
        }

        stage('Frontend') {
          steps {
            sh 'trivy image $FRONTEND_IMAGE:$IMAGE_TAG || true'
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
        sh 'docker compose up -d --build'
      }
    }
  }

  // ================= POST =================
  post {
    success {
      echo 'CI/CD SUCCESS 🚀 Application déployée'
    }
    failure {
      echo 'CI/CD FAILED ❌ Vérifiez les logs'
    }
  }
}