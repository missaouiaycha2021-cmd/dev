pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        BACKEND_IMAGE     = "aycha123/mon-dashboard-backend"
        FRONTEND_IMAGE    = "aycha123/mon-dashboard-frontend"
        IMAGE_TAG         = "v${BUILD_NUMBER}"
        SONAR_PROJECT_KEY = "mon-dashboard"
        SONAR_PROJECT_NAME = "Mon Dashboard"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Check Tools') {
            steps {
                sh '''
                    python3 --version || true
                    node --version || true
                    docker --version || true
                    docker compose version || true
                '''
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('Backend') {
                    steps {
                        dir('backend') {
                            sh 'pip install -r requirements.txt --break-system-packages || true'
                        }
                    }
                }
                stage('Frontend') {
                    steps {
                        dir('frontend') {
                            sh '''
                                export NVM_DIR="$HOME/.nvm"
                                . "$NVM_DIR/nvm.sh"
                                nvm use 20
                                npm ci
                            '''
                        }
                    }
                }
            }
        }

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

        // ====================== SONARQUBE ANALYSIS ======================
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonarqube') {   // Nom configuré dans Jenkins
                    sh '''
                        sonar-scanner \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                            -Dsonar.projectName="${SONAR_PROJECT_NAME}" \
                            -Dsonar.sources=. \
                            -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/build/**,**/venv/**,**/.git/**
                    '''
                }
            }
        }

        // ====================== QUALITY GATE ======================
        stage('Quality Gate') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    script {
                        def qg = waitForQualityGate()
                        echo "🔍 SonarQube Quality Gate Status : ${qg.status}"
                        
                        if (qg.status != 'OK') {
                            error "❌ Quality Gate FAILED : ${qg.status}"
                        } else {
                            echo "✅ Quality Gate PASSED - Code quality is good!"
                        }
                    }
                }
            }
        }

        // ====================== BUILD & DEPLOY ======================
        stage('Build Docker Images') {
            parallel {
                stage('Backend') {
                    steps {
                        sh 'docker build -t $BACKEND_IMAGE:$IMAGE_TAG -t $BACKEND_IMAGE:latest backend/'
                    }
                }
                stage('Frontend') {
                    steps {
                        sh 'docker build -t $FRONTEND_IMAGE:$IMAGE_TAG -t $FRONTEND_IMAGE:latest frontend/'
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
                        sh 'docker push $BACKEND_IMAGE:$IMAGE_TAG && docker push $BACKEND_IMAGE:latest'
                    }
                }
                stage('Frontend') {
                    steps {
                        sh 'docker push $FRONTEND_IMAGE:$IMAGE_TAG && docker push $FRONTEND_IMAGE:latest'
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    docker compose pull || true
                    docker compose down --remove-orphans || true
                    docker compose up -d --force-recreate
                    docker image prune -f
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline réussi → Application déployée'
        }
        failure {
            echo '❌ Pipeline échoué'
        }
        always {
            sh 'docker logout || true'
            cleanWs()
        }
    }
}