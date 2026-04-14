pipeline {
  agent any

  environment {
    BACKEND_IMAGE  = "missaouiaycha/mon-dashboard-backend"
    FRONTEND_IMAGE = "missaouiaycha/mon-dashboard-frontend"
    IMAGE_TAG      = "v${BUILD_NUMBER}"
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

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

    stage('Build Frontend') {
      steps {
        dir('frontend') {
          sh 'npm run build'
        }
      }
    }

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

    stage('Docker Login') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
          sh 'echo $PASS | docker login -u $USER --password-stdin'
        }
      }
    }

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

    stage('Deploy') {
      steps {
        sh 'docker compose down || true'
        sh 'docker compose up -d --build'
      }
    }
  }

  post {
    success {
      echo 'CI/CD SUCCESS 🚀'
    }
    failure {
      echo 'CI/CD FAILED ❌'
    }
    always {
      cleanWs()
    }
  }
}