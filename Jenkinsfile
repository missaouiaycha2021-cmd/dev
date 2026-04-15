pipeline {
  agent any

  environment {
    BACKEND_IMAGE  = "aycha123/mon-dashboard-backend"
    FRONTEND_IMAGE = "aycha123/mon-dashboard-frontend"
    IMAGE_TAG      = "v${BUILD_NUMBER}"
  }

  stages {
    // ================= CHECKOUT =================
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    // ================= VERIFY TOOLS =================
    stage('Check Tools') {
      steps {
        sh '''
          echo "Checking versions..."
          python3 --version || true
          node --version || true
          docker --version || true
          docker compose version || true
        '''
      }
    }

    // ================= INSTALL DEPENDENCIES =================
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
              sh '''
                export NVM_DIR="$HOME/.nvm"
                if [ -s "$NVM_DIR/nvm.sh" ]; then
                  . "$NVM_DIR/nvm.sh"
                else
                  echo "NVM not found ❌" && exit 1
                fi
                nvm install 20
                nvm use 20
                npm install
              '''
            }
          }
        }
      }
    }

    // ================= BUILD FRONTEND =================
    stage('Build Frontend') {
      steps {
        dir('frontend') {
          sh '''
            export NVM_DIR="$HOME/.nvm"
            . "$NVM_DIR/nvm.sh"
            nvm use 20
            npm run build
          '''
        }
      }
    }

    // ================= BUILD DOCKER IMAGES =================
    stage('Build Docker Images') {
      parallel {
        stage('Backend') {
          steps {
            sh 'docker build -t $BACKEND_IMAGE:$IMAGE_TAG backend/'
          }
        }
        stage('Frontend') {
          steps {
            sh 'docker build -t $FRONTEND_IMAGE:$IMAGE_TAG frontend/'
          }
        }
      }
    }

    // ================= DOCKER LOGIN =================
    stage('Docker Login') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'dockerhub',
          usernameVariable: 'USER',
          passwordVariable: 'PASS'
        )]) {
          sh 'echo $PASS | docker login -u $USER --password-stdin'
        }
      }
    }

  // ================= PUSH IMAGES =================
stage('Push Images') {
  parallel {
    stage('Backend') {
      steps {
        sh '''
          docker push $BACKEND_IMAGE:$IMAGE_TAG
          docker tag $BACKEND_IMAGE:$IMAGE_TAG $BACKEND_IMAGE:latest
          docker push $BACKEND_IMAGE:latest
        '''
      }
    }
    stage('Frontend') {
      steps {
        sh '''
          docker push $FRONTEND_IMAGE:$IMAGE_TAG
          docker tag $FRONTEND_IMAGE:$IMAGE_TAG $FRONTEND_IMAGE:latest
          docker push $FRONTEND_IMAGE:latest
        '''
      }
    }
  }
}

    // ================= DEPLOY =================
    stage('Deploy') {
      steps {
        sh '''
          echo "=== Pulling latest images ==="
          docker compose pull

          echo "=== Stopping old containers ==="
          docker compose down || true

          echo "=== Starting new containers ==="
          docker compose up -d

          echo "=== Cleaning unused images ==="
          docker image prune -f
        '''
      }
    }
  }

  // ================= POST ACTIONS =================
  post {
    success {
      echo '✅ CI/CD Pipeline SUCCESS 🚀'
    }
    failure {
      echo '❌ CI/CD Pipeline FAILED'
    }
    always {
      sh 'docker logout || true'
      cleanWs()
    }
  }
}